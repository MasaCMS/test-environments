/*
GCS storage module handler for Masa CMS.

onApplicationLoad: registers gcsStorageService as the application-wide 'fileStorageService'
singleton, overriding the default localStorageService alias set in onApplicationStart_include.cfm.

standardUserAssetActionHandler is no longer needed here — standardEventsHandler.cfc uses
getBean('fileStorageService') directly with the unified {siteid}/{subtype}/{path} key format,
so whichever service is registered as 'fileStorageService' handles all operations automatically.
*/
component output="false" {

	public any function init() {
		return this;
	}

	public function onApplicationLoad(required event) {
		application.serviceFactory.addBean(
			"fileStorageService",
			createObject("component", "muraWRM.modules.filestorage_gcs.model.services.gcsStorageService").init()
		);
		systemOutput("[LOG] [filestorage_gcs.onApplicationLoad] registered gcsStorageService as fileStorageService", true);
	}

}
