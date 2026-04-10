/*
S3 / S3-compatible (MinIO) implementation of IUserAssetStorageService.
Uses cfhttp with AWS Signature V4 for all S3 API calls.

Configuration (passed at init):
  accessInfo - "accessKey^secretKey^bucket" (same format as MURA_FILESTOREACCESSINFO)
  endpoint   - S3 endpoint URL (e.g. "https://s3.amazonaws.com" or "http://minio:9000")

All paths are relative to the bucket root (no leading slash).
The service is stateless per-request - instantiated fresh per handler call.
*/
component
	displayname="S3 Storage Service"
	implements="mura.fileStorage.IUserAssetStorageService"
	extends="mura.cfobject"
	output="false"
{

	variables.accessKey = "";
	variables.secretKey = "";
	variables.bucket = "";
	variables.endpoint = "https://s3.amazonaws.com";
	variables.tempDir = "";
	variables.region = "us-east-1";

	public any function init(
		string accessInfo = "",
		string endpoint = "",
		string region = "us-east-1"
	) {
		var resolvedInfo = len(arguments.accessInfo) ? arguments.accessInfo : application.configBean.getFileStoreAccessInfo();
		variables.accessKey = listFirst(resolvedInfo, "^");
		variables.secretKey = listGetAt(resolvedInfo, 2, "^");
		variables.bucket = listLen(resolvedInfo, "^") gte 3 ? listLast(resolvedInfo, "^") : "masacms-assets";
		variables.endpoint = len(arguments.endpoint) ? arguments.endpoint : application.configBean.getFileStoreEndPoint();
		if (!len(variables.endpoint)) {
			variables.endpoint = "https://s3.amazonaws.com";
		}
		variables.region = arguments.region;
		variables.tempDir = application.configBean.getTempDir();
		return this;
	}

	private string function objectUrl(required string key) {
		return variables.endpoint & "/" & variables.bucket & "/" & reReplace(replace(arguments.key, "\", "/", "ALL"), "^/+", "");
	}

	private string function toKey(required string path) {
		var s = replace(arguments.path, "\", "/", "ALL");
		s = reReplace(s, "^/+", "");
		s = reReplace(s, "/{2,}", "/", "ALL");
		return s;
	}

	private binary function hmacSHA256(required any cryptoKey, required string data) {
		var mac = createObject("java", "javax.crypto.Mac").getInstance("HmacSHA256");
		var keySpec = createObject("java", "javax.crypto.spec.SecretKeySpec").init(
			isSimpleValue(arguments.cryptoKey) ? arguments.cryptoKey.getBytes("UTF-8") : arguments.cryptoKey,
			"HmacSHA256"
		);
		mac.init(keySpec);
		return mac.doFinal(arguments.data.getBytes("UTF-8"));
	}

	private string function sha256Hex(required string data) {
		var md = createObject("java", "java.security.MessageDigest").getInstance("SHA-256");
		var hash = md.digest(arguments.data.getBytes("UTF-8"));
		var hex = createObject("java", "java.math.BigInteger").init(1, hash).toString(16);
		return lpad(hex, 64, "0");
	}

	private string function sha256HexBinary(required binary data) {
		var md = createObject("java", "java.security.MessageDigest").getInstance("SHA-256");
		var hash = md.digest(arguments.data);
		var hex = createObject("java", "java.math.BigInteger").init(1, hash).toString(16);
		return lpad(hex, 64, "0");
	}

	private string function lpad(required string str, required numeric len, string char = "0") {
		var s = arguments.str;
		while (len(s) < arguments.len) {
			s = arguments.char & s;
		}
		return s;
	}

	private struct function buildAuthHeaders(
		required string method,
		required string key,
		string contentType = "",
		string bodyHash = ""
	) {
		var n = now();
		var amzDate = dateFormat(n, "YYYYMMDD") & "T" & timeFormat(n, "HHmmss") & "Z";
		var dateStamp = dateFormat(n, "YYYYMMDD");
		var host = replaceNoCase(variables.endpoint, "https://", "");
		host = replaceNoCase(host, "http://", "");
		var normalizedKey = reReplace(replace(arguments.key, "\", "/", "ALL"), "^/+", "");
		var canonicalUri = "/" & variables.bucket & "/" & normalizedKey;
		var payloadHash = len(arguments.bodyHash) ? arguments.bodyHash : "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
		var headers = {};

		var canonicalHeaders = "content-type:" & arguments.contentType & chr(10) &
			"host:" & host & chr(10) &
			"x-amz-content-sha256:" & payloadHash & chr(10) &
			"x-amz-date:" & amzDate & chr(10);
		var signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
		var canonicalRequest = arguments.method & chr(10) &
			canonicalUri & chr(10) &
			chr(10) &
			canonicalHeaders & chr(10) &
			signedHeaders & chr(10) &
			payloadHash;

		var credentialScope = dateStamp & "/" & variables.region & "/s3/aws4_request";
		var stringToSign = "AWS4-HMAC-SHA256" & chr(10) &
			amzDate & chr(10) &
			credentialScope & chr(10) &
			sha256Hex(canonicalRequest);

		var signingKey = hmacSHA256(hmacSHA256(hmacSHA256(hmacSHA256(
			"AWS4" & variables.secretKey, dateStamp),
			variables.region), "s3"), "aws4_request");
		var signatureHex = createObject("java", "java.math.BigInteger").init(1, hmacSHA256(signingKey, stringToSign)).toString(16);

		headers["Authorization"] = "AWS4-HMAC-SHA256 Credential=" & variables.accessKey & "/" & credentialScope &
			", SignedHeaders=" & signedHeaders & ", Signature=" & signatureHex;
		headers["x-amz-date"] = amzDate;
		headers["x-amz-content-sha256"] = payloadHash;
		headers["Content-Type"] = arguments.contentType;
		headers["Host"] = host;

		return headers;
	}

	public string function readFile(required string path) {
		var key = toKey(arguments.path);
		var headers = buildAuthHeaders("GET", key, "");
		var result = "";
		cfhttp(method="GET", url=objectUrl(key), result="result") {
			cfhttpparam(type="header", name="Authorization", value=headers.Authorization);
			cfhttpparam(type="header", name="x-amz-date", value=headers["x-amz-date"]);
			cfhttpparam(type="header", name="x-amz-content-sha256", value=headers["x-amz-content-sha256"]);
		};
		if (result.statusCode neq "200 OK") {
			throw(message="S3 readFile failed: #result.statusCode# for key=#key#");
		}
		return result.fileContent;
	}

	public any function readFileBinary(required string path) {
		var key = toKey(arguments.path);
		var headers = buildAuthHeaders("GET", key, "");
		var result = "";
		cfhttp(method="GET", url=objectUrl(key), result="result", getAsBinary="yes") {
			cfhttpparam(type="header", name="Authorization", value=headers.Authorization);
			cfhttpparam(type="header", name="x-amz-date", value=headers["x-amz-date"]);
			cfhttpparam(type="header", name="x-amz-content-sha256", value=headers["x-amz-content-sha256"]);
		};
		if (result.statusCode neq "200 OK") {
			throw(message="S3 readFileBinary failed: #result.statusCode# for key=#key#");
		}
		return result.fileContent;
	}

	public void function writeFile(required string path, required any content) {
		var key = toKey(arguments.path);
		var body = isBinary(arguments.content) ? arguments.content : toBinary(toBase64(arguments.content));
		var bodyHash = sha256HexBinary(body);

		var contentType = "application/octet-stream";
		try {
			var ext = listLast(key, ".");
			if (len(ext) && ext neq key) {
				var tmpName = createTempFile("prefix", "." & ext);
				var probed = createObject("java", "java.nio.file.Files").probeContentType(
					createObject("java", "java.io.File").init(tmpName).toPath()
				);
				fileDelete(tmpName);
				if (!isNull(probed) && len(probed)) {
					contentType = probed;
				}
			}
		} catch (any e) {}

		var headers = buildAuthHeaders("PUT", key, contentType, bodyHash);
		var result = "";
		cfhttp(method="PUT", url=objectUrl(key), result="result") {
			cfhttpparam(type="header", name="Authorization", value=headers.Authorization);
			cfhttpparam(type="header", name="x-amz-date", value=headers["x-amz-date"]);
			cfhttpparam(type="header", name="x-amz-content-sha256", value=bodyHash);
			cfhttpparam(type="header", name="Content-Type", value=contentType);
			cfhttpparam(type="body", value=body);
		};
		if (left(result.statusCode, 1) neq "2") {
			throw(message="S3 writeFile failed: #result.statusCode# for key=#key#");
		}
		systemOutput("[LOG] [s3StorageService.writeFile] key=#key# contentType=#contentType# status=#result.statusCode#", true);
	}

	public void function deleteFile(required string path) {
		var key = toKey(arguments.path);
		var headers = buildAuthHeaders("DELETE", key, "");
		var result = "";
		cfhttp(method="DELETE", url=objectUrl(key), result="result") {
			cfhttpparam(type="header", name="Authorization", value=headers.Authorization);
			cfhttpparam(type="header", name="x-amz-date", value=headers["x-amz-date"]);
			cfhttpparam(type="header", name="x-amz-content-sha256", value=headers["x-amz-content-sha256"]);
		};
	}

	public void function deleteDirectory(required string path, boolean recurse = false) {
		var prefix = toKey(arguments.path);
		if (right(prefix, 1) neq "/") {
			prefix = prefix & "/";
		}
		var listing = listObjectsRaw(prefix);
		for (var k in listing) {
			deleteFile("/" & k);
		}
	}

	public boolean function fileExists(required string path) {
		var key = toKey(arguments.path);
		var headers = buildAuthHeaders("HEAD", key, "");
		var result = "";
		cfhttp(method="HEAD", url=objectUrl(key), result="result") {
			cfhttpparam(type="header", name="Authorization", value=headers.Authorization);
			cfhttpparam(type="header", name="x-amz-date", value=headers["x-amz-date"]);
			cfhttpparam(type="header", name="x-amz-content-sha256", value=headers["x-amz-content-sha256"]);
		};
		return result.statusCode eq "200 OK";
	}

	public boolean function directoryExists(required string path) {
		var prefix = toKey(arguments.path);
		if (right(prefix, 1) neq "/") {
			prefix = prefix & "/";
		}
		return arrayLen(listObjectsRaw(prefix)) gt 0;
	}

	private array function listObjectsRaw(required string prefix) {
		var listUrl = variables.endpoint & "/" & variables.bucket & "/?prefix=" & urlEncodedFormat(arguments.prefix) & "&delimiter=/";
		var headers = buildAuthHeaders("GET", "?prefix=" & arguments.prefix, "");
		var result = "";
		var keys = [];
		cfhttp(method="GET", url=listUrl, result="result") {
			cfhttpparam(type="header", name="Authorization", value=headers.Authorization);
			cfhttpparam(type="header", name="x-amz-date", value=headers["x-amz-date"]);
			cfhttpparam(type="header", name="x-amz-content-sha256", value=headers["x-amz-content-sha256"]);
		};
		if (result.statusCode eq "200 OK") {
			var xmlDoc = xmlParse(result.fileContent);
			var contents = xmlSearch(xmlDoc, "//Contents/Key");
			for (var node in contents) {
				arrayAppend(keys, node.xmlText);
			}
		}
		return keys;
	}

	public query function listDirectory(required string path, string filter = "*", string type = "all") {
		var prefix = toKey(arguments.path);
		if (right(prefix, 1) neq "/") {
			prefix = prefix & "/";
		}
		var listUrl = variables.endpoint & "/" & variables.bucket & "/?prefix=" & urlEncodedFormat(prefix) & "&delimiter=/";
		var headers = buildAuthHeaders("GET", "?prefix=" & prefix, "");
		var result = "";
		var rs = queryNew("name,directory,size,type,datelastmodified", "varchar,varchar,integer,varchar,timestamp");
		cfhttp(method="GET", url=listUrl, result="result") {
			cfhttpparam(type="header", name="Authorization", value=headers.Authorization);
			cfhttpparam(type="header", name="x-amz-date", value=headers["x-amz-date"]);
			cfhttpparam(type="header", name="x-amz-content-sha256", value=headers["x-amz-content-sha256"]);
		};
		if (result.statusCode eq "200 OK") {
			var xmlDoc = xmlParse(result.fileContent);
			if (arguments.type neq "file") {
				var prefixes = xmlSearch(xmlDoc, "//CommonPrefixes/Prefix");
				for (var node in prefixes) {
					var dirName = listLast(left(node.xmlText, len(node.xmlText) - 1), "/");
					if (arguments.filter eq "*" || reFindNoCase(replace(arguments.filter, "*", ".*", "ALL"), dirName)) {
						queryAddRow(rs);
						querySetCell(rs, "name", dirName);
						querySetCell(rs, "directory", prefix);
						querySetCell(rs, "size", 0);
						querySetCell(rs, "type", "Dir");
						querySetCell(rs, "datelastmodified", now());
					}
				}
			}
			if (arguments.type neq "dir") {
				var contents = xmlSearch(xmlDoc, "//Contents");
				for (var node in contents) {
					var keyNode = xmlSearch(node, "Key");
					var sizeNode = xmlSearch(node, "Size");
					var modNode = xmlSearch(node, "LastModified");
					var objKey = arrayLen(keyNode) ? keyNode[1].xmlText : "";
					var fileName = listLast(objKey, "/");
					if (len(fileName) && (arguments.filter eq "*" || reFindNoCase(replace(arguments.filter, "*", ".*", "ALL"), fileName))) {
						queryAddRow(rs);
						querySetCell(rs, "name", fileName);
						querySetCell(rs, "directory", prefix);
						querySetCell(rs, "size", arrayLen(sizeNode) ? val(sizeNode[1].xmlText) : 0);
						querySetCell(rs, "type", "File");
						querySetCell(rs, "datelastmodified", arrayLen(modNode) ? parseDateTime(modNode[1].xmlText) : now());
					}
				}
			}
		}
		return rs;
	}

	public void function createDirectory(required string path) {
		var key = toKey(arguments.path);
		if (right(key, 1) neq "/") {
			key = key & "/";
		}
		writeFile("/" & key, "");
	}

	public void function copyFile(required string source, required string destination) {
		var srcKey = toKey(arguments.source);
		var dstKey = toKey(arguments.destination);
		var copySource = "/" & variables.bucket & "/" & srcKey;
		var headers = buildAuthHeaders("PUT", dstKey, "application/octet-stream");
		var result = "";
		cfhttp(method="PUT", url=objectUrl(dstKey), result="result") {
			cfhttpparam(type="header", name="Authorization", value=headers.Authorization);
			cfhttpparam(type="header", name="x-amz-date", value=headers["x-amz-date"]);
			cfhttpparam(type="header", name="x-amz-content-sha256", value=headers["x-amz-content-sha256"]);
			cfhttpparam(type="header", name="x-amz-copy-source", value=copySource);
			cfhttpparam(type="header", name="Content-Type", value="application/octet-stream");
		};
		if (left(result.statusCode, 1) neq "2") {
			throw(message="S3 copyFile failed: #result.statusCode#");
		}
	}

	public void function moveFile(required string source, required string destination) {
		copyFile(arguments.source, arguments.destination);
		deleteFile(arguments.source);
	}

	public void function renameFile(required string source, required string destination) {
		moveFile(arguments.source, arguments.destination);
	}

	public struct function uploadFile(required string destination, required string fileField) {
		var tempUpload = "";
		cffile(
			action="upload",
			fileField=arguments.fileField,
			destination=variables.tempDir,
			nameConflict="makeunique",
			result="tempUpload"
		);
		var localPath = tempUpload.serverDirectory & "/" & tempUpload.serverFile;
		var destKey = reReplace(toKey(arguments.destination), "/+$", "") & "/" & tempUpload.serverFile;
		var fileData = fileReadBinary(localPath);
		writeFile("/" & destKey, fileData);
		fileDelete(localPath);
		systemOutput("[LOG] [s3StorageService.uploadFile] destKey=#destKey# file=#tempUpload.serverFile#", true);
		tempUpload.serverDirectory = variables.endpoint & "/" & variables.bucket & "/" & destKey;
		return tempUpload;
	}

	public string function resolveToLocal(required string path) {
		var key = toKey(arguments.path);
		var ext = listLast(key, ".");
		var tempFile = variables.tempDir & replace(createUUID(), "-", "", "ALL") & "." & ext;
		var headers = buildAuthHeaders("GET", key, "");
		var result = "";
		cfhttp(method="GET", url=objectUrl(key), result="result", getAsBinary="yes") {
			cfhttpparam(type="header", name="Authorization", value=headers.Authorization);
			cfhttpparam(type="header", name="x-amz-date", value=headers["x-amz-date"]);
			cfhttpparam(type="header", name="x-amz-content-sha256", value=headers["x-amz-content-sha256"]);
		};
		systemOutput("[LOG] [s3StorageService.resolveToLocal] key=#key# status=#result.statusCode#", true);
		if (left(result.statusCode, 1) neq "2") {
			return "";
		}
		var fileContent = result.fileContent;
		if (!isBinary(fileContent)) {
			fileContent = toBinary(toBase64(fileContent));
		}
		cffile(action="write", file=tempFile, output=fileContent);
		return tempFile;
	}

	public void function writeFromLocal(required string localPath, required string remotePath) {
		var fileData = fileReadBinary(arguments.localPath);
		writeFile(arguments.remotePath, fileData);
		fileDelete(arguments.localPath);
	}

	public string function getBaseUrl(required string siteid) {
		return variables.endpoint & "/" & variables.bucket;
	}

	public void function uploadBinary(required any data, required string contentType, required string key) {
		writeFile(arguments.key, arguments.data);
	}

	public void function deleteObject(required string key) {
		deleteFile(arguments.key);
	}

	public boolean function streamToResponse(required string path, string method = "inline") {
		var key = toKey(arguments.path);
		var mediaUrl = objectUrl(key);
		var authHdrs = buildAuthHeaders("GET", key, "");
		var conn = createObject("java", "java.net.URL").init(mediaUrl).openConnection();
		conn.setRequestProperty("Authorization", authHdrs.Authorization);
		conn.setRequestProperty("x-amz-date", authHdrs["x-amz-date"]);
		conn.setRequestProperty("x-amz-content-sha256", authHdrs["x-amz-content-sha256"]);
		conn.setConnectTimeout(5000);
		conn.setReadTimeout(30000);
		conn.connect();
		var statusCode = conn.getResponseCode();
		systemOutput("[LOG] [s3StorageService.streamToResponse] key=#key# statusCode=#statusCode#", true);
		if (statusCode neq 200) {
			conn.disconnect();
			return false;
		}
		var contentType = conn.getContentType();
		var contentLength = conn.getContentLengthLong();
		var filename = listLast(key, "/");
		if (isNull(contentType) || !len(contentType)) {
			contentType = "application/octet-stream";
		}
		var response = getPageContext().getResponse();
		response.setContentType(contentType);
		if (contentLength gt 0) {
			response.setHeader("Content-Length", contentLength);
		}
		var disposition = (arguments.method eq "attachment") ? "attachment" : "inline";
		response.setHeader("Content-Disposition", disposition & "; filename=""" & filename & """");
		response.setHeader("Cache-Control", "max-age=86400");
		var is = conn.getInputStream();
		var os = response.getOutputStream();
		var buffer = createObject("java", "java.lang.reflect.Array").newInstance(
			createObject("java", "java.lang.Byte").TYPE,
			65536
		);
		var bytesRead = 0;
		while (true) {
			bytesRead = is.read(buffer);
			if (bytesRead eq -1) {
				break;
			}
			os.write(buffer, 0, bytesRead);
		}
		os.flush();
		is.close();
		conn.disconnect();
		return true;
	}

}
