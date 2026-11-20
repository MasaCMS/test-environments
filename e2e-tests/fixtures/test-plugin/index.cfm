<cfinclude template="plugin/config.cfm" />
<cfsavecontent variable="variables.body">
	<cfoutput>
		<h2 id="e2e-plugin-admin">E2E Test Plugin admin page</h2>
		<p>Greeting setting: <span id="e2e-plugin-greeting-setting">#esapiEncode('html', pluginConfig.getSetting('greeting'))#</span></p>
	</cfoutput>
</cfsavecontent>
<cfoutput>#application.pluginManager.renderAdminTemplate(body=variables.body, pageTitle=pluginConfig.getName())#</cfoutput>
