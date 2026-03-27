<!---
S3 / S3-compatible (MinIO) implementation of IUserAssetStorageService.
Uses cfhttp with AWS Signature V4 for all S3 API calls.

Configuration (passed at init):
  accessInfo - "accessKey^secretKey^bucket" (same format as MURA_FILESTOREACCESSINFO)
  endpoint   - S3 endpoint URL (e.g. "https://s3.amazonaws.com" or "http://minio:9000")

All paths are relative to the bucket root (no leading slash).
The service is stateless per-request - instantiated fresh per handler call.
--->
<cfcomponent
	displayname="S3 Storage Service"
	implements="mura.fileStorage.IUserAssetStorageService"
	extends="mura.cfobject"
	output="false">

	<cfset variables.accessKey  = "">
	<cfset variables.secretKey  = "">
	<cfset variables.bucket     = "">
	<cfset variables.endpoint   = "https://s3.amazonaws.com">
	<cfset variables.tempDir    = "">
	<cfset variables.region     = "us-east-1">

	<cffunction name="init" access="public" returntype="any" output="false">
		<cfargument name="accessInfo" type="string" required="false" default=""
			hint="Format: accessKey^secretKey^bucket. Empty = read from configBean.">
		<cfargument name="endpoint" type="string" required="false" default=""
			hint="S3 endpoint URL. Empty = read from configBean.">
		<cfargument name="region" type="string" required="false" default="us-east-1">
		<cfscript>
			var resolvedInfo = len(arguments.accessInfo) ? arguments.accessInfo : application.configBean.getFileStoreAccessInfo();
			variables.accessKey = listFirst(resolvedInfo, "^");
			variables.secretKey = listGetAt(resolvedInfo, 2, "^");
			variables.bucket    = listLen(resolvedInfo, "^") gte 3 ? listLast(resolvedInfo, "^") : "masacms-assets";
			variables.endpoint  = len(arguments.endpoint) ? arguments.endpoint : application.configBean.getFileStoreEndPoint();
			if (!len(variables.endpoint)) { variables.endpoint = "https://s3.amazonaws.com"; }
			variables.region    = arguments.region;
			variables.tempDir   = application.configBean.getTempDir();
		</cfscript>
		<cfreturn this>
	</cffunction>

	<!--- Build the full S3 URL for a key --->
	<cffunction name="objectUrl" access="private" returntype="string" output="false">
		<cfargument name="key" type="string" required="true">
		<cfreturn variables.endpoint & "/" & variables.bucket & "/" & reReplace(replace(arguments.key, "\", "/", "ALL"), "^/+", "")>
	</cffunction>

	<!--- Normalized key: strip leading slash, collapse internal double-slashes --->
	<cffunction name="toKey" access="private" returntype="string" output="false">
		<cfargument name="path" type="string" required="true">
		<cfscript>
			var s = replace(arguments.path, "\", "/", "ALL");
			s = reReplace(s, "^/+", "");
			s = reReplace(s, "/{2,}", "/", "ALL");
			return s;
		</cfscript>
	</cffunction>

	<!--- AWS Signature V4 HMAC-SHA256 helper --->
	<cffunction name="hmacSHA256" access="private" returntype="binary" output="false">
		<cfargument name="key" type="any" required="true">
		<cfargument name="data" type="string" required="true">
		<cfscript>
			var mac = createObject("java", "javax.crypto.Mac").getInstance("HmacSHA256");
			var keySpec = createObject("java", "javax.crypto.spec.SecretKeySpec").init(
				isSimpleValue(arguments.key) ? arguments.key.getBytes("UTF-8") : arguments.key,
				"HmacSHA256"
			);
			mac.init(keySpec);
			return mac.doFinal(arguments.data.getBytes("UTF-8"));
		</cfscript>
	</cffunction>

	<cffunction name="sha256Hex" access="private" returntype="string" output="false">
		<cfargument name="data" type="string" required="true">
		<cfscript>
			var md = createObject("java", "java.security.MessageDigest").getInstance("SHA-256");
			var hash = md.digest(arguments.data.getBytes("UTF-8"));
			var hex = createObject("java", "java.math.BigInteger").init(1, hash).toString(16);
			return lpad(hex, 64, "0");
		</cfscript>
	</cffunction>

	<cffunction name="sha256HexBinary" access="private" returntype="string" output="false">
		<cfargument name="data" type="binary" required="true">
		<cfscript>
			var md = createObject("java", "java.security.MessageDigest").getInstance("SHA-256");
			var hash = md.digest(arguments.data);
			var hex = createObject("java", "java.math.BigInteger").init(1, hash).toString(16);
			return lpad(hex, 64, "0");
		</cfscript>
	</cffunction>

	<cffunction name="lpad" access="private" returntype="string" output="false">
		<cfargument name="str" type="string" required="true">
		<cfargument name="len" type="numeric" required="true">
		<cfargument name="char" type="string" required="false" default="0">
		<cfloop condition="len(arguments.str) lt arguments.len">
			<cfset arguments.str = arguments.char & arguments.str>
		</cfloop>
		<cfreturn arguments.str>
	</cffunction>

	<!--- Build AWS SigV4 authorization headers for a request --->
	<cffunction name="buildAuthHeaders" access="private" returntype="struct" output="false">
		<cfargument name="method" type="string" required="true">
		<cfargument name="key" type="string" required="true">
		<cfargument name="contentType" type="string" required="false" default="">
		<cfargument name="bodyHash" type="string" required="false" default="">
		<cfscript>
			var now = now();
			var amzDate = dateFormat(now, "YYYYMMDD") & "T" & timeFormat(now, "HHmmss") & "Z";
			var dateStamp = dateFormat(now, "YYYYMMDD");
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
			var signatureHex = createObject("java","java.math.BigInteger").init(1, hmacSHA256(signingKey, stringToSign)).toString(16);

			headers["Authorization"] = "AWS4-HMAC-SHA256 Credential=" & variables.accessKey & "/" & credentialScope &
				", SignedHeaders=" & signedHeaders & ", Signature=" & signatureHex;
			headers["x-amz-date"] = amzDate;
			headers["x-amz-content-sha256"] = payloadHash;
			headers["Content-Type"] = arguments.contentType;
			headers["Host"] = host;

			return headers;
		</cfscript>
	</cffunction>

	<!--- ==================== READ ==================== --->

	<cffunction name="readFile" access="public" returntype="string" output="false">
		<cfargument name="path" type="string" required="true">
		<cfscript>
			var key = toKey(arguments.path);
			var headers = buildAuthHeaders("GET", key, "");
			var result = "";
		</cfscript>
		<cfhttp method="GET" url="#objectUrl(key)#" result="result">
			<cfhttpparam type="header" name="Authorization" value="#headers.Authorization#">
			<cfhttpparam type="header" name="x-amz-date" value="#headers['x-amz-date']#">
			<cfhttpparam type="header" name="x-amz-content-sha256" value="#headers['x-amz-content-sha256']#">
		</cfhttp>
		<cfif result.statusCode neq "200 OK">
			<cfthrow message="S3 readFile failed: #result.statusCode# for key=#key#">
		</cfif>
		<cfreturn result.fileContent>
	</cffunction>

	<cffunction name="readFileBinary" access="public" returntype="any" output="false">
		<cfargument name="path" type="string" required="true">
		<cfscript>
			var key = toKey(arguments.path);
			var headers = buildAuthHeaders("GET", key, "");
			var result = "";
		</cfscript>
		<cfhttp method="GET" url="#objectUrl(key)#" result="result" getAsBinary="yes">
			<cfhttpparam type="header" name="Authorization" value="#headers.Authorization#">
			<cfhttpparam type="header" name="x-amz-date" value="#headers['x-amz-date']#">
			<cfhttpparam type="header" name="x-amz-content-sha256" value="#headers['x-amz-content-sha256']#">
		</cfhttp>
		<cfif result.statusCode neq "200 OK">
			<cfthrow message="S3 readFileBinary failed: #result.statusCode# for key=#key#">
		</cfif>
		<cfreturn result.fileContent>
	</cffunction>

	<!--- ==================== WRITE ==================== --->

	<cffunction name="writeFile" access="public" returntype="void" output="false">
		<cfargument name="path" type="string" required="true">
		<cfargument name="content" type="any" required="true">
		<cfscript>
			var key = toKey(arguments.path);
			var body = isBinary(arguments.content) ? arguments.content : toBinary(toBase64(arguments.content));
			var bodyHash = sha256HexBinary(body);

			// Detect MIME type from key extension for correct Content-Type on serving
			var contentType = "application/octet-stream";
			try {
				var ext = listLast(key, ".");
				if (len(ext) and ext neq key) {
					var tmpName = createTempFile("prefix", "." & ext);
					var probed = createObject("java", "java.nio.file.Files").probeContentType(
						createObject("java", "java.io.File").init(tmpName).toPath()
					);
					fileDelete(tmpName);
					if (!isNull(probed) and len(probed)) { contentType = probed; }
				}
			} catch (any e) {}

			var headers = buildAuthHeaders("PUT", key, contentType, bodyHash);
			var result = "";
		</cfscript>
		<cfhttp method="PUT" url="#objectUrl(key)#" result="result">
			<cfhttpparam type="header" name="Authorization" value="#headers.Authorization#">
			<cfhttpparam type="header" name="x-amz-date" value="#headers['x-amz-date']#">
			<cfhttpparam type="header" name="x-amz-content-sha256" value="#bodyHash#">
			<cfhttpparam type="header" name="Content-Type" value="#contentType#">
			<cfhttpparam type="body" value="#body#">
		</cfhttp>
		<cfif left(result.statusCode, 1) neq "2">
			<cfthrow message="S3 writeFile failed: #result.statusCode# for key=#key#">
		</cfif>
		<cfset systemOutput("[LOG] [s3StorageService.writeFile] key=#key# contentType=#contentType# status=#result.statusCode#", true)>
	</cffunction>

	<!--- ==================== DELETE ==================== --->

	<cffunction name="deleteFile" access="public" returntype="void" output="false">
		<cfargument name="path" type="string" required="true">
		<cfscript>
			var key = toKey(arguments.path);
			var headers = buildAuthHeaders("DELETE", key, "");
			var result = "";
		</cfscript>
		<cfhttp method="DELETE" url="#objectUrl(key)#" result="result">
			<cfhttpparam type="header" name="Authorization" value="#headers.Authorization#">
			<cfhttpparam type="header" name="x-amz-date" value="#headers['x-amz-date']#">
			<cfhttpparam type="header" name="x-amz-content-sha256" value="#headers['x-amz-content-sha256']#">
		</cfhttp>
	</cffunction>

	<cffunction name="deleteDirectory" access="public" returntype="void" output="false">
		<cfargument name="path" type="string" required="true">
		<cfargument name="recurse" type="boolean" required="false" default="false">
		<cfscript>
			var prefix = toKey(arguments.path);
			if (right(prefix, 1) neq "/") { prefix = prefix & "/"; }
			var listing = listObjectsRaw(prefix);
			var key = "";
			for (key in listing) {
				deleteFile("/" & key);
			}
		</cfscript>
	</cffunction>

	<!--- ==================== EXISTS ==================== --->

	<cffunction name="fileExists" access="public" returntype="boolean" output="false">
		<cfargument name="path" type="string" required="true">
		<cfscript>
			var key = toKey(arguments.path);
			var headers = buildAuthHeaders("HEAD", key, "");
			var result = "";
		</cfscript>
		<cfhttp method="HEAD" url="#objectUrl(key)#" result="result">
			<cfhttpparam type="header" name="Authorization" value="#headers.Authorization#">
			<cfhttpparam type="header" name="x-amz-date" value="#headers['x-amz-date']#">
			<cfhttpparam type="header" name="x-amz-content-sha256" value="#headers['x-amz-content-sha256']#">
		</cfhttp>
		<cfreturn result.statusCode eq "200 OK">
	</cffunction>

	<cffunction name="directoryExists" access="public" returntype="boolean" output="false">
		<cfargument name="path" type="string" required="true">
		<cfscript>
			var prefix = toKey(arguments.path);
			if (right(prefix, 1) neq "/") { prefix = prefix & "/"; }
			return arrayLen(listObjectsRaw(prefix)) gt 0;
		</cfscript>
	</cffunction>

	<!--- ==================== LIST ==================== --->

	<cffunction name="listObjectsRaw" access="private" returntype="array" output="false"
		hint="Returns array of key strings matching a prefix">
		<cfargument name="prefix" type="string" required="true">
		<cfscript>
			var listUrl = variables.endpoint & "/" & variables.bucket & "/?prefix=" & urlEncodedFormat(arguments.prefix) & "&delimiter=/";
			var headers = buildAuthHeaders("GET", "?prefix=" & arguments.prefix, "");
			var result = "";
			var keys = [];
		</cfscript>
		<cfhttp method="GET" url="#listUrl#" result="result">
			<cfhttpparam type="header" name="Authorization" value="#headers.Authorization#">
			<cfhttpparam type="header" name="x-amz-date" value="#headers['x-amz-date']#">
			<cfhttpparam type="header" name="x-amz-content-sha256" value="#headers['x-amz-content-sha256']#">
		</cfhttp>
		<cfif result.statusCode eq "200 OK">
			<cfset var xmlDoc = xmlParse(result.fileContent)>
			<cfset var contents = xmlSearch(xmlDoc, "//Contents/Key")>
			<cfloop array="#contents#" index="node">
				<cfset arrayAppend(keys, node.xmlText)>
			</cfloop>
		</cfif>
		<cfreturn keys>
	</cffunction>

	<cffunction name="listDirectory" access="public" returntype="query" output="false">
		<cfargument name="path" type="string" required="true">
		<cfargument name="filter" type="string" required="false" default="*">
		<cfargument name="type" type="string" required="false" default="all">
		<cfscript>
			var prefix = toKey(arguments.path);
			if (right(prefix, 1) neq "/") { prefix = prefix & "/"; }
			var listUrl = variables.endpoint & "/" & variables.bucket & "/?prefix=" & urlEncodedFormat(prefix) & "&delimiter=/";
			var headers = buildAuthHeaders("GET", "?prefix=" & prefix, "");
			var result = "";
			var rs = queryNew("name,directory,size,type,datelastmodified", "varchar,varchar,integer,varchar,timestamp");
		</cfscript>
		<cfhttp method="GET" url="#listUrl#" result="result">
			<cfhttpparam type="header" name="Authorization" value="#headers.Authorization#">
			<cfhttpparam type="header" name="x-amz-date" value="#headers['x-amz-date']#">
			<cfhttpparam type="header" name="x-amz-content-sha256" value="#headers['x-amz-content-sha256']#">
		</cfhttp>
		<cfif result.statusCode eq "200 OK">
			<cfset var xmlDoc = xmlParse(result.fileContent)>
			<cfif arguments.type neq "file">
				<cfset var prefixes = xmlSearch(xmlDoc, "//CommonPrefixes/Prefix")>
				<cfloop array="#prefixes#" index="node">
					<cfset var dirName = listLast(left(node.xmlText, len(node.xmlText) - 1), "/")>
					<cfif arguments.filter eq "*" or reFindNoCase(replace(arguments.filter, "*", ".*", "ALL"), dirName)>
						<cfset queryAddRow(rs)>
						<cfset querySetCell(rs, "name", dirName)>
						<cfset querySetCell(rs, "directory", prefix)>
						<cfset querySetCell(rs, "size", 0)>
						<cfset querySetCell(rs, "type", "Dir")>
						<cfset querySetCell(rs, "datelastmodified", now())>
					</cfif>
				</cfloop>
			</cfif>
			<cfif arguments.type neq "dir">
				<cfset var contents = xmlSearch(xmlDoc, "//Contents")>
				<cfloop array="#contents#" index="node">
					<cfset var keyNode = xmlSearch(node, "Key")>
					<cfset var sizeNode = xmlSearch(node, "Size")>
					<cfset var modNode = xmlSearch(node, "LastModified")>
					<cfset var key = arrayLen(keyNode) ? keyNode[1].xmlText : "">
					<cfset var fileName = listLast(key, "/")>
					<cfif len(fileName) and (arguments.filter eq "*" or reFindNoCase(replace(arguments.filter, "*", ".*", "ALL"), fileName))>
						<cfset queryAddRow(rs)>
						<cfset querySetCell(rs, "name", fileName)>
						<cfset querySetCell(rs, "directory", prefix)>
						<cfset querySetCell(rs, "size", arrayLen(sizeNode) ? val(sizeNode[1].xmlText) : 0)>
						<cfset querySetCell(rs, "type", "File")>
						<cfset querySetCell(rs, "datelastmodified", arrayLen(modNode) ? parseDateTime(modNode[1].xmlText) : now())>
					</cfif>
				</cfloop>
			</cfif>
		</cfif>
		<cfreturn rs>
	</cffunction>

	<!--- ==================== DIRECTORIES ==================== --->

	<cffunction name="createDirectory" access="public" returntype="void" output="false">
		<cfargument name="path" type="string" required="true">
		<!--- S3 has no real directories; directories are implicit via key prefixes.
		      Write a zero-byte placeholder object to make the "directory" show up in listings. --->
		<cfset var key = toKey(arguments.path)>
		<cfif right(key, 1) neq "/"> <cfset key = key & "/"> </cfif>
		<cfset writeFile("/" & key, "")>
	</cffunction>

	<!--- ==================== COPY / MOVE / RENAME ==================== --->

	<cffunction name="copyFile" access="public" returntype="void" output="false">
		<cfargument name="source" type="string" required="true">
		<cfargument name="destination" type="string" required="true">
		<cfscript>
			var srcKey = toKey(arguments.source);
			var dstKey = toKey(arguments.destination);
			var copySource = "/" & variables.bucket & "/" & srcKey;
			var headers = buildAuthHeaders("PUT", dstKey, "application/octet-stream");
			var result = "";
		</cfscript>
		<cfhttp method="PUT" url="#objectUrl(dstKey)#" result="result">
			<cfhttpparam type="header" name="Authorization" value="#headers.Authorization#">
			<cfhttpparam type="header" name="x-amz-date" value="#headers['x-amz-date']#">
			<cfhttpparam type="header" name="x-amz-content-sha256" value="#headers['x-amz-content-sha256']#">
			<cfhttpparam type="header" name="x-amz-copy-source" value="#copySource#">
			<cfhttpparam type="header" name="Content-Type" value="application/octet-stream">
		</cfhttp>
		<cfif left(result.statusCode, 1) neq "2">
			<cfthrow message="S3 copyFile failed: #result.statusCode#">
		</cfif>
	</cffunction>

	<cffunction name="moveFile" access="public" returntype="void" output="false">
		<cfargument name="source" type="string" required="true">
		<cfargument name="destination" type="string" required="true">
		<cfset copyFile(arguments.source, arguments.destination)>
		<cfset deleteFile(arguments.source)>
	</cffunction>

	<cffunction name="renameFile" access="public" returntype="void" output="false">
		<cfargument name="source" type="string" required="true">
		<cfargument name="destination" type="string" required="true">
		<cfset moveFile(arguments.source, arguments.destination)>
	</cffunction>

	<!--- ==================== UPLOAD ==================== --->

	<cffunction name="uploadFile" access="public" returntype="struct" output="false">
		<cfargument name="destination" type="string" required="true">
		<cfargument name="fileField" type="string" required="true">
		<cfscript>
			var tempUpload = "";
		</cfscript>
		<cffile action="upload"
			fileField="#arguments.fileField#"
			destination="#variables.tempDir#"
			nameConflict="makeunique"
			result="tempUpload">
		<cfscript>
			var localPath = tempUpload.serverDirectory & "/" & tempUpload.serverFile;
			// Strip trailing slashes from destination to avoid double-slash keys
			var destKey = reReplace(toKey(arguments.destination), "/+$", "") & "/" & tempUpload.serverFile;
			var fileData = fileReadBinary(localPath);
			writeFile("/" & destKey, fileData);
			fileDelete(localPath);
			systemOutput("[LOG] [s3StorageService.uploadFile] destKey=#destKey# file=#tempUpload.serverFile#", true);
			tempUpload.serverDirectory = variables.endpoint & "/" & variables.bucket & "/" & destKey;
			return tempUpload;
		</cfscript>
	</cffunction>

	<!--- ==================== LOCAL RESOLUTION (for image ops) ==================== --->

	<cffunction name="resolveToLocal" access="public" returntype="string" output="false">
		<cfargument name="path" type="string" required="true">
		<cfscript>
			var key = toKey(arguments.path);
			var ext = listLast(key, ".");
			var tempFile = variables.tempDir & replace(createUUID(), "-", "", "ALL") & "." & ext;
			var headers = buildAuthHeaders("GET", key, "");
			var result = "";
		</cfscript>
		<cfhttp method="GET" url="#objectUrl(key)#" result="result" getAsBinary="yes">
			<cfhttpparam type="header" name="Authorization" value="#headers.Authorization#">
			<cfhttpparam type="header" name="x-amz-date" value="#headers['x-amz-date']#">
			<cfhttpparam type="header" name="x-amz-content-sha256" value="#headers['x-amz-content-sha256']#">
		</cfhttp>
		<cfscript>
			systemOutput("[LOG] [s3StorageService.resolveToLocal] key=#key# status=#result.statusCode#", true);
			if (left(result.statusCode, 1) neq "2") {
				return "";
			}
			// Write binary content explicitly to temp file
			var fileContent = result.fileContent;
			if (!isBinary(fileContent)) {
				fileContent = toBinary(toBase64(fileContent));
			}
		</cfscript>
		<cffile action="write" file="#tempFile#" output="#fileContent#">
		<cfreturn tempFile>
	</cffunction>

	<cffunction name="writeFromLocal" access="public" returntype="void" output="false">
		<cfargument name="localPath" type="string" required="true">
		<cfargument name="remotePath" type="string" required="true">
		<cfscript>
			var fileData = fileReadBinary(arguments.localPath);
			writeFile(arguments.remotePath, fileData);
			fileDelete(arguments.localPath);
		</cfscript>
	</cffunction>

	<!--- ==================== URL ==================== --->

	<cffunction name="getBaseUrl" access="public" returntype="string" output="false">
		<cfargument name="siteid" type="string" required="true">
		<cfreturn variables.endpoint & "/" & variables.bucket>
	</cffunction>

	<!--- ==================== GCS-compatible binary upload (for fileDAO.cfc) ==================== --->

	<cffunction name="uploadBinary" access="public" returntype="void" output="false"
		hint="Upload raw binary data with a specified content type and key. Used by fileDAO.cfc for content file caching.">
		<cfargument name="data" type="any" required="true">
		<cfargument name="contentType" type="string" required="true">
		<cfargument name="key" type="string" required="true">
		<cfset writeFile(arguments.key, arguments.data)>
	</cffunction>

	<cffunction name="deleteObject" access="public" returntype="void" output="false"
		hint="Delete a specific object by key. Used by fileDAO.cfc for content file cache cleanup.">
		<cfargument name="key" type="string" required="true">
		<cfset deleteFile(arguments.key)>
	</cffunction>

	<!--- ==================== STREAMING PROXY ==================== --->

	<cffunction name="streamToResponse" access="public" returntype="boolean" output="false"
		hint="Stream an S3 object directly to the servlet response without buffering to disk.
		      Returns true if the object was found and streamed, false if not found (404).">
		<cfargument name="path" type="string" required="true">
		<cfargument name="method" type="string" required="false" default="inline">
		<cfscript>
			var key        = toKey(arguments.path);
			var mediaUrl   = objectUrl(key);
			var authHdrs   = buildAuthHeaders("GET", key, "");
			var conn       = createObject("java", "java.net.URL").init(mediaUrl).openConnection();
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
			var contentType   = conn.getContentType();
			var contentLength = conn.getContentLengthLong();
			var filename      = listLast(key, "/");
			if (isNull(contentType) || !len(contentType)) { contentType = "application/octet-stream"; }
			var response = getPageContext().getResponse();
			response.setContentType(contentType);
			if (contentLength gt 0) { response.setHeader("Content-Length", contentLength); }
			var disposition = (arguments.method eq "attachment") ? "attachment" : "inline";
			response.setHeader("Content-Disposition", disposition & "; filename=""" & filename & """");
			response.setHeader("Cache-Control", "max-age=86400");
			var is = conn.getInputStream();
			var os = response.getOutputStream();
			var buffer = createObject("java", "java.lang.reflect.Array").newInstance(
				createObject("java", "java.lang.Byte").TYPE, 65536
			);
			var bytesRead = 0;
			while (true) {
				bytesRead = is.read(buffer);
				if (bytesRead eq -1) { break; }
				os.write(buffer, 0, bytesRead);
			}
			os.flush();
			is.close();
			conn.disconnect();
			return true;
		</cfscript>
	</cffunction>

</cfcomponent>
