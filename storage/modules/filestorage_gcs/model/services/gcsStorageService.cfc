/*
Google Cloud Storage implementation of IUserAssetStorageService.
Uses the GCS JSON API via cfhttp. Works with fake-gcs-server for local testing.

Configuration (passed at init):
  bucket      - GCS bucket name (MURA_GCSBUCKET)
  endpoint    - GCS API endpoint (MURA_GCSENDPOINT, defaults to https://storage.googleapis.com)
  credentials - Service account JSON key string or access token (MURA_GCSCREDENTIALS)
                For testing with fake-gcs-server, leave credentials empty.

Authentication:
  If credentials contains a JSON service account key, uses JWT + OAuth2 token exchange.
  If credentials contains a raw Bearer token, uses it directly.
  If empty, makes unauthenticated requests (suitable for fake-gcs-server in testing).

All paths are relative to the bucket root (no leading slash).
*/
component
	displayname="GCS Storage Service"
	implements="mura.fileStorage.IUserAssetStorageService"
	extends="mura.cfobject"
	output="false"
{

	variables.bucket = "";
	variables.endpoint = "https://storage.googleapis.com";
	variables.credentials = "";
	variables.tempDir = "";
	variables.cachedToken = "";
	variables.tokenExpiry = "";

	public any function init(
		string bucket = "",
		string endpoint = "",
		string credentials = ""
	) {
		variables.bucket = len(arguments.bucket) ? arguments.bucket : application.configBean.getGcsBucket();
		variables.endpoint = len(arguments.endpoint) ? arguments.endpoint : application.configBean.getGcsEndpoint();
		variables.credentials = len(arguments.credentials) ? arguments.credentials : application.configBean.getGcsCredentials();
		if (!len(variables.endpoint)) {
			variables.endpoint = "https://storage.googleapis.com";
		}
		variables.tempDir = application.configBean.getTempDir();
		return this;
	}

	private string function toKey(required string path) {
		var s = replace(arguments.path, "\", "/", "ALL");
		s = reReplace(s, "^/+", "");
		s = reReplace(s, "//{1,}", "/", "ALL");
		return s;
	}

	private string function objectApiUrl(required string key) {
		return variables.endpoint & "/storage/v1/b/" & variables.bucket & "/o/" & urlEncodedFormat(arguments.key);
	}

	private string function objectMediaUrl(required string key) {
		return variables.endpoint & "/download/storage/v1/b/" & variables.bucket & "/o/" & urlEncodedFormat(arguments.key) & "?alt=media";
	}

	private string function uploadUrl(required string key, string contentType = "application/octet-stream") {
		return variables.endpoint & "/upload/storage/v1/b/" & variables.bucket & "/o?uploadType=media&name=" & urlEncodedFormat(arguments.key);
	}

	private string function getBearerToken() {
		if (!len(variables.credentials)) {
			return "";
		}
		if (isJSON(variables.credentials)) {
			if (len(variables.cachedToken) && isDate(variables.tokenExpiry) && now() lt variables.tokenExpiry) {
				return variables.cachedToken;
			}
			variables.cachedToken = exchangeServiceAccountForToken(variables.credentials);
			variables.tokenExpiry = dateAdd("s", 3500, now());
			return variables.cachedToken;
		}
		return variables.credentials;
	}

	private string function exchangeServiceAccountForToken(required string serviceAccountJson) {
		var sa = deserializeJSON(arguments.serviceAccountJson);
		var nowSec = int(getTickCount() / 1000);
		var header = { "alg": "RS256", "typ": "JWT" };
		var claims = {
			"iss": sa.client_email,
			"scope": "https://www.googleapis.com/auth/devstorage.read_write",
			"aud": "https://oauth2.googleapis.com/token",
			"exp": nowSec + 3600,
			"iat": nowSec
		};
		var headerB64 = toBase64(serializeJSON(header)).replace("+", "-", "ALL").replace("/", "_", "ALL").replace("=", "", "ALL");
		var claimsB64 = toBase64(serializeJSON(claims)).replace("+", "-", "ALL").replace("/", "_", "ALL").replace("=", "", "ALL");
		var sigInput = headerB64 & "." & claimsB64;
		var privateKey = sa.private_key;
		var keyFactory = createObject("java", "java.security.KeyFactory").getInstance("RSA");
		var pkcs8Key = replace(replace(replace(privateKey, "-----BEGIN PRIVATE KEY-----", ""), "-----END PRIVATE KEY-----", ""), chr(10), "", "ALL");
		var keySpec = createObject("java", "java.security.spec.PKCS8EncodedKeySpec").init(toBinary(pkcs8Key));
		var signerKey = keyFactory.generatePrivate(keySpec);
		var signer = createObject("java", "java.security.Signature").getInstance("SHA256withRSA");
		signer.initSign(signerKey);
		signer.update(sigInput.getBytes("UTF-8"));
		var sigB64 = toBase64(signer.sign()).replace("+", "-", "ALL").replace("/", "_", "ALL").replace("=", "", "ALL");
		var jwt = sigInput & "." & sigB64;
		var tokenResult = "";
		cfhttp(method="POST", url="https://oauth2.googleapis.com/token", result="tokenResult") {
			cfhttpparam(type="formfield", name="grant_type", value="urn:ietf:params:oauth:grant-type:jwt-bearer");
			cfhttpparam(type="formfield", name="assertion", value=jwt);
		};
		if (tokenResult.statusCode eq "200 OK") {
			return deserializeJSON(tokenResult.fileContent).access_token;
		}
		throw(message="GCS token exchange failed: #tokenResult.statusCode#");
	}

	private string function addAuthHeader(required string token) {
		return "Bearer " & arguments.token;
	}

	public string function readFile(required string path) {
		var key = toKey(arguments.path);
		var token = getBearerToken();
		var result = "";
		cfhttp(method="GET", url=objectMediaUrl(key), result="result") {
			if (len(token)) {
				cfhttpparam(type="header", name="Authorization", value="Bearer #token#");
			}
		};
		if (result.statusCode neq "200 OK") {
			throw(message="GCS readFile failed: #result.statusCode# for key=#key#");
		}
		return result.fileContent;
	}

	public any function readFileBinary(required string path) {
		var key = toKey(arguments.path);
		var token = getBearerToken();
		var result = "";
		cfhttp(method="GET", url=objectMediaUrl(key), result="result", getAsBinary="yes") {
			if (len(token)) {
				cfhttpparam(type="header", name="Authorization", value="Bearer #token#");
			}
		};
		if (result.statusCode neq "200 OK") {
			throw(message="GCS readFileBinary failed: #result.statusCode# for key=#key#");
		}
		return result.fileContent;
	}

	public void function writeFile(required string path, required any content) {
		var key = toKey(arguments.path);
		var token = getBearerToken();
		var body = isBinary(arguments.content) ? arguments.content : arguments.content.getBytes("UTF-8");
		var result = "";
		var mimeType = "application/octet-stream";
		if (find(".", key)) {
			var detected = createObject("java", "java.nio.file.Files").probeContentType(
				createObject("java", "java.io.File").init(key).toPath()
			);
			if (!isNull(detected) && len(detected)) {
				mimeType = detected;
			}
		}
		systemOutput("[LOG] [gcsStorageService.writeFile] key=#key# url=#uploadUrl(key)# bodyLen=#arrayLen(body)# mimeType=#mimeType#", true);
		cfhttp(method="POST", url=uploadUrl(key), result="result") {
			cfhttpparam(type="header", name="Content-Type", value=mimeType);
			if (len(token)) {
				cfhttpparam(type="header", name="Authorization", value="Bearer #token#");
			}
			cfhttpparam(type="body", value=body);
		};
		systemOutput("[LOG] [gcsStorageService.writeFile] result=#result.statusCode# key=#key#", true);
		if (left(result.statusCode, 1) neq "2") {
			throw(message="GCS writeFile failed: #result.statusCode# for key=#key#");
		}
	}

	public void function deleteFile(required string path) {
		var key = toKey(arguments.path);
		var token = getBearerToken();
		var result = "";
		cfhttp(method="DELETE", url=objectApiUrl(key), result="result") {
			if (len(token)) {
				cfhttpparam(type="header", name="Authorization", value="Bearer #token#");
			}
		};
	}

	public void function deleteDirectory(required string path, boolean recurse = false) {
		var prefix = toKey(arguments.path);
		if (len(prefix) && right(prefix, 1) neq "/") {
			prefix = prefix & "/";
		}
		var keys = listObjectKeysRaw(prefix);
		for (var k in keys) {
			deleteFile("/" & k);
		}
	}

	public boolean function fileExists(required string path) {
		var key = toKey(arguments.path);
		var token = getBearerToken();
		var result = "";
		cfhttp(method="GET", url=objectApiUrl(key), result="result") {
			if (len(token)) {
				cfhttpparam(type="header", name="Authorization", value="Bearer #token#");
			}
		};
		systemOutput("[LOG] [gcsStorageService.fileExists] key=#key# statusCode=#result.statusCode# exists=#result.statusCode eq '200 OK'#", true);
		return result.statusCode eq "200 OK";
	}

	public boolean function directoryExists(required string path) {
		var prefix = toKey(arguments.path);
		if (len(prefix) && right(prefix, 1) neq "/") {
			prefix = prefix & "/";
		}
		return arrayLen(listObjectKeysRaw(prefix)) gt 0;
	}

	private array function listObjectKeysRaw(required string prefix) {
		var listUrl = variables.endpoint & "/storage/v1/b/" & variables.bucket & "/o?prefix=" & urlEncodedFormat(arguments.prefix) & "&delimiter=/";
		var token = getBearerToken();
		var result = "";
		var keys = [];
		cfhttp(method="GET", url=listUrl, result="result") {
			if (len(token)) {
				cfhttpparam(type="header", name="Authorization", value="Bearer #token#");
			}
		};
		if (result.statusCode eq "200 OK" && isJSON(result.fileContent)) {
			var data = deserializeJSON(result.fileContent);
			if (structKeyExists(data, "items") && isArray(data.items)) {
				for (var item in data.items) {
					arrayAppend(keys, item.name);
				}
			}
		}
		return keys;
	}

	public query function listDirectory(required string path, string filter = "*", string type = "all") {
		var prefix = toKey(arguments.path);
		if (len(prefix) && right(prefix, 1) neq "/") {
			prefix = prefix & "/";
		}
		var listUrl = variables.endpoint & "/storage/v1/b/" & variables.bucket & "/o?prefix=" & urlEncodedFormat(prefix) & "&delimiter=/";
		var token = getBearerToken();
		var result = "";
		var rs = queryNew("name,directory,size,type,datelastmodified", "varchar,varchar,integer,varchar,timestamp");
		systemOutput("[LOG] [gcsStorageService.listDirectory] path=#arguments.path# prefix=#prefix# url=#listUrl#", true);
		cfhttp(method="GET", url=listUrl, result="result") {
			if (len(token)) {
				cfhttpparam(type="header", name="Authorization", value="Bearer #token#");
			}
		};
		systemOutput("[LOG] [gcsStorageService.listDirectory] statusCode=#result.statusCode# isJSON=#isJSON(result.fileContent)# response=#left(result.fileContent, 300)#", true);
		if (result.statusCode eq "200 OK" && isJSON(result.fileContent)) {
			var data = deserializeJSON(result.fileContent);
			if (arguments.type neq "file" && structKeyExists(data, "prefixes") && isArray(data.prefixes)) {
				for (var pfx in data.prefixes) {
					var dirName = listLast(left(pfx, len(pfx) - 1), "/", true);
					if (arguments.filter eq "*" || reFindNoCase(replace(arguments.filter, "*", ".*", "ALL"), dirName)) {
						queryAddRow(rs);
						querySetCell(rs, "name", dirName);
						querySetCell(rs, "directory", prefix);
						querySetCell(rs, "size", 0);
						querySetCell(rs, "type", "Dir", true);
						querySetCell(rs, "datelastmodified", now());
					}
				}
			}
			if (arguments.type neq "dir" && structKeyExists(data, "items") && isArray(data.items)) {
				for (var item in data.items) {
					var fileName = listLast(item.name, "/", true);
					if (len(fileName) && (arguments.filter eq "*" || reFindNoCase(replace(arguments.filter, "*", ".*", "ALL"), fileName))) {
						queryAddRow(rs);
						querySetCell(rs, "name", fileName);
						querySetCell(rs, "directory", prefix);
						querySetCell(rs, "size", structKeyExists(item, "size") ? val(item.size) : 0);
						querySetCell(rs, "type", "File", true);
						querySetCell(rs, "datelastmodified", structKeyExists(item, "updated") ? parseDateTime(item.updated) : now());
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
		var token = getBearerToken();
		var copyUrl = variables.endpoint & "/storage/v1/b/" & variables.bucket & "/o/" & urlEncodedFormat(srcKey) & "/copyTo/b/" & variables.bucket & "/o/" & urlEncodedFormat(dstKey);
		var result = "";
		cfhttp(method="POST", url=copyUrl, result="result") {
			cfhttpparam(type="header", name="Content-Type", value="application/json");
			if (len(token)) {
				cfhttpparam(type="header", name="Authorization", value="Bearer #token#");
			}
			cfhttpparam(type="body", value="{}");
		};
		if (left(result.statusCode, 1) neq "2") {
			throw(message="GCS copyFile failed: #result.statusCode#");
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
		systemOutput("[LOG] [gcsStorageService.uploadFile] destination=#arguments.destination# destKey=#destKey# serverFile=#tempUpload.serverFile#", true);
		writeFile("/" & destKey, fileData);
		fileDelete(localPath);
		systemOutput("[LOG] [gcsStorageService.uploadFile] done destKey=#destKey#", true);
		tempUpload.serverDirectory = variables.endpoint & "/storage/v1/b/" & variables.bucket & "/" & destKey;
		return tempUpload;
	}

	public boolean function streamToResponse(required string path, string method = "inline") {
		var key = toKey(arguments.path);
		var token = getBearerToken();
		var mediaUrl = objectMediaUrl(key);
		var conn = createObject("java", "java.net.URL").init(mediaUrl).openConnection();
		if (len(token))å {
			conn.setRequestProperty("Authorization", "Bearer " & token);
		}
		conn.setConnectTimeout(5000);
		conn.setReadTimeout(30000);
		conn.connect();
		var statusCode = conn.getResponseCode();
		systemOutput("[LOG] [gcsStorageService.streamToResponse] key=#key# statusCode=#statusCode#", true);
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

	public string function resolveToLocal(required string path) {
		var key = toKey(arguments.path);
		var ext = listLast(key, ".");
		var tempFileName = replace(createUUID(), "-", "", "ALL") & "." & ext;
		var tempFile = variables.tempDir & tempFileName;
		var token = getBearerToken();
		var result = "";
		cfhttp(method="GET", url=objectMediaUrl(key), result="result", getAsBinary="yes") {
			if (len(token)) {
				cfhttpparam(type="header", name="Authorization", value="Bearer #token#");
			}
		};
		systemOutput("[LOG] [gcsStorageService.resolveToLocal] key=#key# statusCode=#result.statusCode# contentLen=#isBinary(result.fileContent) ? arrayLen(result.fileContent) : len(result.fileContent)#", true);
		if (left(result.statusCode, 1) neq "2") {
			return "";
		}
		cffile(action="write", file=tempFile, output=result.fileContent);
		return tempFile;
	}

	public void function writeFromLocal(required string localPath, required string remotePath) {
		systemOutput("[LOG] [gcsStorageService.writeFromLocal] localPath=#arguments.localPath# remotePath=#arguments.remotePath# key=#toKey(arguments.remotePath)#");
		var fileData = fileReadBinary(arguments.localPath);
		writeFile(arguments.remotePath, fileData);
		fileDelete(arguments.localPath);
		systemOutput("[LOG] [gcsStorageService.writeFromLocal] done remotePath=#arguments.remotePath#");
	}

	public string function getBaseUrl(required string siteid) {
		return variables.endpoint & "/" & variables.bucket;
	}

	public void function uploadBinary(required any data, required string contentType, required string key) {
		var normalizedKey = toKey(arguments.key);
		var token = getBearerToken();
		var body = isBinary(arguments.data) ? arguments.data : arguments.data.getBytes("UTF-8");
		var result = "";
		systemOutput("[LOG] [gcsStorageService.uploadBinary] key=#arguments.key# normalizedKey=#normalizedKey# contentType=#arguments.contentType# bodyLen=#arrayLen(body)#", true);
		cfhttp(
			method="POST",
			url=variables.endpoint & "/upload/storage/v1/b/" & variables.bucket & "/o?uploadType=media&name=" & urlEncodedFormat(normalizedKey),
			result="result"
		) {
			cfhttpparam(type="header", name="Content-Type", value=arguments.contentType);
			if (len(token)) {
				cfhttpparam(type="header", name="Authorization", value="Bearer #token#");
			}
			cfhttpparam(type="body", value=body);
		};
		systemOutput("[LOG] [gcsStorageService.uploadBinary] result=#result.statusCode# key=#normalizedKey#", true);
		if (left(result.statusCode, 1) neq "2") {
			throw(message="GCS uploadBinary failed: #result.statusCode# for key=#normalizedKey#");
		}
	}

	public void function deleteObject(required string key) {
		deleteFile(arguments.key);
	}

}
