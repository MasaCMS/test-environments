<cfsilent>
	<cfset pluginID = listLast(listGetAt(getDirectoryFromPath(getCurrentTemplatePath()), listLen(getDirectoryFromPath(getCurrentTemplatePath()), application.configBean.getFileDelim()) - 1, application.configBean.getFileDelim()), "_")>
	<cfset pluginConfig = application.pluginManager.getConfig(pluginID)>
	<cfset request.pluginConfig = pluginConfig>
	<!--- getModulePerm() also lets super users in --->
	<cfif not structKeyExists(session, "siteID") or not application.permUtility.getModulePerm(pluginConfig.getValue('moduleID'), session.siteid)>
		<cflocation url="#application.configBean.getContext()#/admin/" addtoken="false">
	</cfif>
</cfsilent>
