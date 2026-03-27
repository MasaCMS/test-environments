<!---
S3 storage module handler for Masa CMS.

onApplicationLoad: registers s3StorageService as the application-wide 'fileStorageService'
singleton, overriding the default localStorageService alias set in onApplicationStart_include.cfm.

standardUserAssetActionHandler is no longer needed here — standardEventsHandler.cfc uses
getBean('fileStorageService') directly with the unified {siteid}/{subtype}/{path} key format,
so whichever service is registered as 'fileStorageService' handles all operations automatically.
--->
<cfcomponent output="false">

<cffunction name="init" access="public" returntype="any" output="false">
	<cfreturn this>
</cffunction>

<cffunction name="onApplicationLoad" output="false">
	<cfargument name="event" required="true">
	<cfscript>
		application.serviceFactory.addBean("fileStorageService",
			createObject("component", "muraWRM.modules.filestorage_s3.model.services.s3StorageService").init()
		);
		systemOutput("[LOG] [filestorage_s3.onApplicationLoad] registered s3StorageService as fileStorageService", true);
	</cfscript>
</cffunction>

</cfcomponent>
