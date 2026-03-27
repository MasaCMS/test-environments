<?xml version="1.0" encoding="UTF-8"?>
<cfoutput>
<mura>
	<name>File Storage - GCS</name>
	<package>filestorage_gcs</package>
	<directoryFormat>packageName</directoryFormat>
	<version>1.0</version>
	<provider>Masa CMS</provider>
	<providerURL>https://masacms.com</providerURL>
	<category>Utilities</category>
	<description>Google Cloud Storage backend for User_Assets. Overrides standardUserAssetActionHandler to route User_Assets I/O through the GCS JSON API via cfhttp. Configured via MURA_GCSBUCKET, MURA_GCSCREDENTIALS, and MURA_GCSENDPOINT. Works with fake-gcs-server for local testing.</description>
	<eventHandlers>
		<eventHandler event="standardUserAssetAction" component="filestorage_gcs.model.handlers.handler" persist="true" />
	</eventHandlers>
</mura>
</cfoutput>
