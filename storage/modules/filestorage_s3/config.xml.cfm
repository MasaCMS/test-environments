<?xml version="1.0" encoding="UTF-8"?>
<cfoutput>
<mura>
	<name>File Storage - S3</name>
	<package>filestorage_s3</package>
	<directoryFormat>packageName</directoryFormat>
	<version>1.0</version>
	<provider>Masa CMS</provider>
	<providerURL>https://masacms.com</providerURL>
	<category>Utilities</category>
	<description>S3 / S3-compatible (MinIO) storage backend for User_Assets. Overrides standardUserAssetActionHandler to route User_Assets I/O through S3 via cfhttp + AWS Signature V4. Configured via MURA_FILESTOREACCESSINFO (key^secret^bucket) and MURA_FILESTOREENDPOINT.</description>
	<eventHandlers>
		<eventHandler event="standardUserAssetAction" component="filestorage_s3.model.handlers.handler" persist="true" />
	</eventHandlers>
</mura>
</cfoutput>
