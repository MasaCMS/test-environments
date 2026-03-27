<!---
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
--->
<cfcomponent
	displayname="GCS Storage Service"
	implements="mura.fileStorage.IUserAssetStorageService"
	extends="mura.cfobject"
	output="false">

	<cfset variables.bucket      = "">
	<cfset variables.endpoint    = "https://storage.googleapis.com">
	<cfset variables.credentials = "">
	<cfset variables.tempDir     = "">
	<cfset variables.cachedToken = "">
	<cfset variables.tokenExpiry = "">

	<cffunction name="init" access="public" returntype="any" output="false">
		<cfargument name="bucket" type="string" required="false" default="">
		<cfargument name="endpoint" type="string" required="false" default="">
		<cfargument name="credentials" type="string" required="false" default="">
		<cfscript>
			variables.bucket      = len(arguments.bucket)      ? arguments.bucket      : application.configBean.getGcsBucket();
			variables.endpoint    = len(arguments.endpoint)    ? arguments.endpoint    : application.configBean.getGcsEndpoint();
			variables.credentials = len(arguments.credentials) ? arguments.credentials : application.configBean.getGcsCredentials();
			if (!len(variables.endpoint)) { variables.endpoint = "https://storage.googleapis.com"; }
			variables.tempDir     = application.configBean.getTempDir();
		</cfscript>
		<cfreturn this>
	</cffunction>

	<!--- Normalize relative path to an object name (no leading slash, no double slashes) --->
	<cffunction name="toKey" access="private" returntype="string" output="false">
		<cfargument name="path" type="string" required="true">
		<cfscript>
			var s = replace(arguments.path, "\", "/", "ALL");
			s = reReplace(s, "^/+", "");
			s = reReplace(s, "//{1,}", "/", "ALL");
			return s;
		</cfscript>
	</cffunction>

	<!--- GCS JSON API base URL for a specific object --->
	<cffunction name="objectApiUrl" access="private" returntype="string" output="false">
		<cfargument name="key" type="string" required="true">
		<cfreturn variables.endpoint & "/storage/v1/b/" & variables.bucket & "/o/" & urlEncodedFormat(arguments.key)>
	</cffunction>

	<!--- GCS media download URL for an object --->
	<cffunction name="objectMediaUrl" access="private" returntype="string" output="false">
		<cfargument name="key" type="string" required="true">
		<cfreturn variables.endpoint & "/download/storage/v1/b/" & variables.bucket & "/o/" & urlEncodedFormat(arguments.key) & "?alt=media">
	</cffunction>

	<!--- GCS upload URL --->
	<cffunction name="uploadUrl" access="private" returntype="string" output="false">
		<cfargument name="key" type="string" required="true">
		<cfargument name="contentType" type="string" required="false" default="application/octet-stream">
		<cfreturn variables.endpoint & "/upload/storage/v1/b/" & variables.bucket & "/o?uploadType=media&name=" & urlEncodedFormat(arguments.key)>
	</cffunction>

	<!--- Get Bearer token for GCS API calls --->
	<cffunction name="getBearerToken" access="private" returntype="string" output="false">
		<cfscript>
			if (!len(variables.credentials)) { return ""; }
			if (isJSON(variables.credentials)) {
				if (len(variables.cachedToken) && isDate(variables.tokenExpiry) && now() lt variables.tokenExpiry) {
					return variables.cachedToken;
				}
				variables.cachedToken = exchangeServiceAccountForToken(variables.credentials);
				variables.tokenExpiry = dateAdd("s", 3500, now());
				return variables.cachedToken;
			}
			return variables.credentials;
		</cfscript>
	</cffunction>

	<!--- Exchange service account JSON for an access token via OAuth2 --->
	<cffunction name="exchangeServiceAccountForToken" access="private" returntype="string" output="false">
		<cfargument name="serviceAccountJson" type="string" required="true">
		<cfscript>
			var sa = deserializeJSON(arguments.serviceAccountJson);
			var now = int(getTickCount() / 1000);
			var header = {"alg":"RS256","typ":"JWT"};
			var claims = {
				"iss": sa.client_email,
				"scope": "https://www.googleapis.com/auth/devstorage.read_write",
				"aud": "https://oauth2.googleapis.com/token",
				"exp": now + 3600,
				"iat": now
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
		</cfscript>
		<cfhttp method="POST" url="https://oauth2.googleapis.com/token" result="tokenResult">
			<cfhttpparam type="formfield" name="grant_type" value="urn:ietf:params:oauth:grant-type:jwt-bearer">
			<cfhttpparam type="formfield" name="assertion" value="#jwt#">
		</cfhttp>
		<cfif tokenResult.statusCode eq "200 OK">
			<cfreturn deserializeJSON(tokenResult.fileContent).access_token>
		</cfif>
		<cfthrow message="GCS token exchange failed: #tokenResult.statusCode#">
	</cffunction>

	<!--- Add auth header to cfhttp params if we have credentials --->
	<cffunction name="addAuthHeader" access="private" returntype="string" output="false">
		<cfargument name="token" type="string" required="true">
		<cfreturn "Bearer " & arguments.token>
	</cffunction>

	<!--- ==================== READ ==================== --->

	<cffunction name="readFile" access="public" returntype="string" output="false">
		<cfargument name="path" type="string" required="true">
		<cfscript>
			var key = toKey(arguments.path);
			var token = getBearerToken();
			var result = "";
		</cfscript>
		<cfhttp method="GET" url="#objectMediaUrl(key)#" result="result">
			<cfif len(token)>
				<cfhttpparam type="header" name="Authorization" value="Bearer #token#">
			</cfif>
		</cfhttp>
		<cfif result.statusCode neq "200 OK">
			<cfthrow message="GCS readFile failed: #result.statusCode# for key=#key#">
		</cfif>
		<cfreturn result.fileContent>
	</cffunction>

	<cffunction name="readFileBinary" access="public" returntype="any" output="false">
		<cfargument name="path" type="string" required="true">
		<cfscript>
			var key = toKey(arguments.path);
			var token = getBearerToken();
			var result = "";
		</cfscript>
		<cfhttp method="GET" url="#objectMediaUrl(key)#" result="result" getAsBinary="yes">
			<cfif len(token)>
				<cfhttpparam type="header" name="Authorization" value="Bearer #token#">
			</cfif>
		</cfhttp>
		<cfif result.statusCode neq "200 OK">
			<cfthrow message="GCS readFileBinary failed: #result.statusCode# for key=#key#">
		</cfif>
		<cfreturn result.fileContent>
	</cffunction>

	<!--- ==================== WRITE ==================== --->

	<cffunction name="writeFile" access="public" returntype="void" output="false">
		<cfargument name="path" type="string" required="true">
		<cfargument name="content" type="any" required="true">
		<cfscript>
			var key = toKey(arguments.path);
			var token = getBearerToken();
			var body = isBinary(arguments.content) ? arguments.content : arguments.content.getBytes("UTF-8");
			var result = "";
			var mimeType = "application/octet-stream";
			if (find(".", key)) {
				var detected = createObject("java", "java.nio.file.Files").probeContentType(
					createObject("java", "java.io.File").init(key).toPath()
				);
				if (!isNull(detected) && len(detected)) { mimeType = detected; }
			}
		</cfscript>
		<cfset systemOutput("[LOG] [gcsStorageService.writeFile] key=#key# url=#uploadUrl(key)# bodyLen=#arrayLen(body)# mimeType=#mimeType#", true)>
		<cfhttp method="POST" url="#uploadUrl(key)#" result="result">
			<cfhttpparam type="header" name="Content-Type" value="#mimeType#">
			<cfif len(token)>
				<cfhttpparam type="header" name="Authorization" value="Bearer #token#">
			</cfif>
			<cfhttpparam type="body" value="#body#">
		</cfhttp>
		<cfset systemOutput("[LOG] [gcsStorageService.writeFile] result=#result.statusCode# key=#key#", true)>
		<cfif left(result.statusCode, 1) neq "2">
			<cfthrow message="GCS writeFile failed: #result.statusCode# for key=#key#">
		</cfif>
	</cffunction>

	<!--- ==================== DELETE ==================== --->

	<cffunction name="deleteFile" access="public" returntype="void" output="false">
		<cfargument name="path" type="string" required="true">
		<cfscript>
			var key = toKey(arguments.path);
			var token = getBearerToken();
			var result = "";
		</cfscript>
		<cfhttp method="DELETE" url="#objectApiUrl(key)#" result="result">
			<cfif len(token)>
				<cfhttpparam type="header" name="Authorization" value="Bearer #token#">
			</cfif>
		</cfhttp>
	</cffunction>

	<cffunction name="deleteDirectory" access="public" returntype="void" output="false">
		<cfargument name="path" type="string" required="true">
		<cfargument name="recurse" type="boolean" required="false" default="false">
		<cfscript>
			var prefix = toKey(arguments.path);
			if (len(prefix) && right(prefix, 1) neq "/") { prefix = prefix & "/"; }
			var keys = listObjectKeysRaw(prefix);
			for (var key in keys) {
				deleteFile("/" & key);
			}
		</cfscript>
	</cffunction>

	<!--- ==================== EXISTS ==================== --->

	<cffunction name="fileExists" access="public" returntype="boolean" output="false">
		<cfargument name="path" type="string" required="true">
		<cfscript>
			var key = toKey(arguments.path);
			var token = getBearerToken();
			var result = "";
		</cfscript>
		<cfhttp method="GET" url="#objectApiUrl(key)#" result="result">
			<cfif len(token)>
				<cfhttpparam type="header" name="Authorization" value="Bearer #token#">
			</cfif>
		</cfhttp>
		<cfset systemOutput("[LOG] [gcsStorageService.fileExists] key=#key# statusCode=#result.statusCode# exists=#result.statusCode eq '200 OK'#", true)>
		<cfreturn result.statusCode eq "200 OK">
	</cffunction>

	<cffunction name="directoryExists" access="public" returntype="boolean" output="false">
		<cfargument name="path" type="string" required="true">
		<cfscript>
			var prefix = toKey(arguments.path);
			if (len(prefix) && right(prefix, 1) neq "/") { prefix = prefix & "/"; }
			return arrayLen(listObjectKeysRaw(prefix)) gt 0;
		</cfscript>
	</cffunction>

	<!--- ==================== LIST ==================== --->

	<cffunction name="listObjectKeysRaw" access="private" returntype="array" output="false"
		hint="Returns array of GCS object name strings matching a prefix">
		<cfargument name="prefix" type="string" required="true">
		<cfscript>
			var listUrl = variables.endpoint & "/storage/v1/b/" & variables.bucket & "/o?prefix=" & urlEncodedFormat(arguments.prefix) & "&delimiter=/";
			var token = getBearerToken();
			var result = "";
			var keys = [];
		</cfscript>
		<cfhttp method="GET" url="#listUrl#" result="result">
			<cfif len(token)>
				<cfhttpparam type="header" name="Authorization" value="Bearer #token#">
			</cfif>
		</cfhttp>
		<cfif result.statusCode eq "200 OK" and isJSON(result.fileContent)>
			<cfset var data = deserializeJSON(result.fileContent)>
			<cfif structKeyExists(data, "items") and isArray(data.items)>
				<cfloop array="#data.items#" index="item">
					<cfset arrayAppend(keys, item.name)>
				</cfloop>
			</cfif>
		</cfif>
		<cfreturn keys>
	</cffunction>

	<cffunction name="listDirectory" access="public" returntype="query" output="false">
		<cfargument name="path" type="string" required="true">
		<cfargument name="filter" type="string" required="false" default="*">
		<cfargument name="type" type="string" required="false" default="all">
		<cfscript>
			var prefix = toKey(arguments.path);
			if (len(prefix) && right(prefix, 1) neq "/") { prefix = prefix & "/"; }
			var listUrl = variables.endpoint & "/storage/v1/b/" & variables.bucket & "/o?prefix=" & urlEncodedFormat(prefix) & "&delimiter=/";
			var token = getBearerToken();
			var result = "";
			var rs = queryNew("name,directory,size,type,datelastmodified", "varchar,varchar,integer,varchar,timestamp");
		</cfscript>
		<cfset systemOutput("[LOG] [gcsStorageService.listDirectory] path=#arguments.path# prefix=#prefix# url=#listUrl#", true)>
		<cfhttp method="GET" url="#listUrl#" result="result">
			<cfif len(token)>
				<cfhttpparam type="header" name="Authorization" value="Bearer #token#">
			</cfif>
		</cfhttp>
		<cfset systemOutput("[LOG] [gcsStorageService.listDirectory] statusCode=#result.statusCode# isJSON=#isJSON(result.fileContent)# response=#left(result.fileContent, 300)#", true)>
		<cfif result.statusCode eq "200 OK" and isJSON(result.fileContent)>
			<cfset var data = deserializeJSON(result.fileContent)>
			<cfif arguments.type neq "file" and structKeyExists(data, "prefixes") and isArray(data.prefixes)>
				<cfloop array="#data.prefixes#" index="pfx">
					<cfset var dirName = listLast(left(pfx, len(pfx) - 1), "/", true)>
					<cfif arguments.filter eq "*" or reFindNoCase(replace(arguments.filter, "*", ".*", "ALL"), dirName)>
						<cfset queryAddRow(rs)>
						<cfset querySetCell(rs, "name", dirName)>
						<cfset querySetCell(rs, "directory", prefix)>
						<cfset querySetCell(rs, "size", 0)>
						<cfset querySetCell(rs, "type", "Dir", true)>
						<cfset querySetCell(rs, "datelastmodified", now())>
					</cfif>
				</cfloop>
			</cfif>
			<cfif arguments.type neq "dir" and structKeyExists(data, "items") and isArray(data.items)>
				<cfloop array="#data.items#" index="item">
					<cfset var fileName = listLast(item.name, "/", true)>
					<cfif len(fileName) and (arguments.filter eq "*" or reFindNoCase(replace(arguments.filter, "*", ".*", "ALL"), fileName))>
						<cfset queryAddRow(rs)>
						<cfset querySetCell(rs, "name", fileName)>
						<cfset querySetCell(rs, "directory", prefix)>
						<cfset querySetCell(rs, "size", structKeyExists(item, "size") ? val(item.size) : 0)>
						<cfset querySetCell(rs, "type", "File", true)>
						<cfset querySetCell(rs, "datelastmodified", structKeyExists(item, "updated") ? parseDateTime(item.updated) : now())>
					</cfif>
				</cfloop>
			</cfif>
		</cfif>
		<cfreturn rs>
	</cffunction>

	<!--- ==================== DIRECTORIES ==================== --->

	<cffunction name="createDirectory" access="public" returntype="void" output="false">
		<cfargument name="path" type="string" required="true">
		<!--- GCS has no real directories; write a zero-byte placeholder --->
		<cfset var key = toKey(arguments.path)>
		<cfif right(key, 1) neq "/"> <cfset key = key & "/"> </cfif>
		<cfset writeFile("/" & key, "", true)>
	</cffunction>

	<!--- ==================== COPY / MOVE / RENAME ==================== --->

	<cffunction name="copyFile" access="public" returntype="void" output="false">
		<cfargument name="source" type="string" required="true">
		<cfargument name="destination" type="string" required="true">
		<cfscript>
			var srcKey = toKey(arguments.source);
			var dstKey = toKey(arguments.destination);
			var token = getBearerToken();
			var copyUrl = variables.endpoint & "/storage/v1/b/" & variables.bucket & "/o/" & urlEncodedFormat(srcKey) & "/copyTo/b/" & variables.bucket & "/o/" & urlEncodedFormat(dstKey);
			var result = "";
		</cfscript>
		<cfhttp method="POST" url="#copyUrl#" result="result">
			<cfhttpparam type="header" name="Content-Type" value="application/json">
			<cfif len(token)>
				<cfhttpparam type="header" name="Authorization" value="Bearer #token#">
			</cfif>
			<cfhttpparam type="body" value="{}">
		</cfhttp>
		<cfif left(result.statusCode, 1) neq "2">
			<cfthrow message="GCS copyFile failed: #result.statusCode#">
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
		var destKey = reReplace(toKey(arguments.destination), "/+$", "") & "/" & tempUpload.serverFile;
		var fileData = fileReadBinary(localPath);
		systemOutput("[LOG] [gcsStorageService.uploadFile] destination=#arguments.destination# destKey=#destKey# serverFile=#tempUpload.serverFile#", true);
		writeFile("/" & destKey, fileData);
		fileDelete(localPath);
		systemOutput("[LOG] [gcsStorageService.uploadFile] done destKey=#destKey#", true);
		tempUpload.serverDirectory = variables.endpoint & "/storage/v1/b/" & variables.bucket & "/" & destKey;
		return tempUpload;
		</cfscript>
	</cffunction>

	<!--- ==================== STREAMING PROXY ==================== --->

	<cffunction name="streamToResponse" access="public" returntype="boolean" output="false"
		hint="Stream a GCS object directly to the servlet response without buffering to disk.
		      Returns true if the object was found and streamed, false if not found (404).">
		<cfargument name="path" type="string" required="true">
		<cfargument name="method" type="string" required="false" default="inline">
		<cfscript>
			var key       = toKey(arguments.path);
			var token     = getBearerToken();
			var mediaUrl  = objectMediaUrl(key);
			var conn      = createObject("java", "java.net.URL").init(mediaUrl).openConnection();
			if (len(token)) { conn.setRequestProperty("Authorization", "Bearer " & token); }
			conn.setConnectTimeout(5000);
			conn.setReadTimeout(30000);
			conn.connect();
			var statusCode = conn.getResponseCode();
			systemOutput("[LOG] [gcsStorageService.streamToResponse] key=#key# statusCode=#statusCode#", true);
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

	<!--- ==================== LOCAL RESOLUTION (for image ops) ==================== --->

	<cffunction name="resolveToLocal" access="public" returntype="string" output="false">
		<cfargument name="path" type="string" required="true">
		<cfscript>
			var key = toKey(arguments.path);
			var ext = listLast(key, ".");
			var tempFileName = replace(createUUID(), "-", "", "ALL") & "." & ext;
			var tempFile = variables.tempDir & tempFileName;
			var token = getBearerToken();
			var result = "";
		</cfscript>
		<cfhttp method="GET" url="#objectMediaUrl(key)#" result="result" getAsBinary="yes">
			<cfif len(token)>
				<cfhttpparam type="header" name="Authorization" value="Bearer #token#">
			</cfif>
		</cfhttp>
		<cfset systemOutput("[LOG] [gcsStorageService.resolveToLocal] key=#key# statusCode=#result.statusCode# contentLen=#isBinary(result.fileContent) ? arrayLen(result.fileContent) : len(result.fileContent)#", true)>
		<cfif left(result.statusCode, 1) neq "2">
			<cfreturn "">
		</cfif>
		<cffile action="write" file="#tempFile#" output="#result.fileContent#">
		<cfreturn tempFile>
	</cffunction>

	<cffunction name="writeFromLocal" access="public" returntype="void" output="false">
		<cfargument name="localPath" type="string" required="true">
		<cfargument name="remotePath" type="string" required="true">
		<cfscript>
			systemOutput("[LOG] [gcsStorageService.writeFromLocal] localPath=#arguments.localPath# remotePath=#arguments.remotePath# key=#toKey(arguments.remotePath)#");
			var fileData = fileReadBinary(arguments.localPath);
			writeFile(arguments.remotePath, fileData);
			fileDelete(arguments.localPath);
			systemOutput("[LOG] [gcsStorageService.writeFromLocal] done remotePath=#arguments.remotePath#");
		</cfscript>
	</cffunction>

	<!--- ==================== URL ==================== --->

	<cffunction name="getBaseUrl" access="public" returntype="string" output="false">
		<cfargument name="siteid" type="string" required="true">
		<cfreturn variables.endpoint & "/" & variables.bucket>
	</cffunction>

	<!--- ==================== fileDAO helpers (for content file caching) ==================== --->

	<cffunction name="uploadBinary" access="public" returntype="void" output="false"
		hint="Upload raw binary data with content type and key. Used by fileDAO.cfc for content file caching.">
		<cfargument name="data" type="any" required="true">
		<cfargument name="contentType" type="string" required="true">
		<cfargument name="key" type="string" required="true">
		<cfscript>
			var normalizedKey = toKey(arguments.key);
			var token = getBearerToken();
			var body = isBinary(arguments.data) ? arguments.data : arguments.data.getBytes("UTF-8");
			var result = "";
		</cfscript>
		<cfset systemOutput("[LOG] [gcsStorageService.uploadBinary] key=#arguments.key# normalizedKey=#normalizedKey# contentType=#arguments.contentType# bodyLen=#arrayLen(body)#", true)>
		<cfhttp method="POST" url="#variables.endpoint#/upload/storage/v1/b/#variables.bucket#/o?uploadType=media&name=#urlEncodedFormat(normalizedKey)#" result="result">
			<cfhttpparam type="header" name="Content-Type" value="#arguments.contentType#">
			<cfif len(token)>
				<cfhttpparam type="header" name="Authorization" value="Bearer #token#">
			</cfif>
			<cfhttpparam type="body" value="#body#">
		</cfhttp>
		<cfset systemOutput("[LOG] [gcsStorageService.uploadBinary] result=#result.statusCode# key=#normalizedKey#", true)>
		<cfif left(result.statusCode, 1) neq "2">
			<cfthrow message="GCS uploadBinary failed: #result.statusCode# for key=#normalizedKey#">
		</cfif>
	</cffunction>

	<cffunction name="deleteObject" access="public" returntype="void" output="false"
		hint="Delete a specific object by key. Used by fileDAO.cfc for content file cache cleanup.">
		<cfargument name="key" type="string" required="true">
		<cfset deleteFile(arguments.key)>
	</cffunction>

</cfcomponent>
