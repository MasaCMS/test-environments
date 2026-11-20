#!/usr/bin/env bash
#
# Builds the test plugin zips in fixtures/ from fixtures/test-plugin/.
#   test-plugin.zip      version 1.0
#   test-plugin-v2.zip   version 2.0; its display object also shows the version, so an update is visible
#
# The zips are committed; run this after changing the plugin source.
set -euo pipefail
cd "$(dirname "$0")/../fixtures"

rm -f test-plugin.zip test-plugin-v2.zip
(cd test-plugin && zip -qr -X ../test-plugin.zip . -x '.DS_Store')

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
cp -R test-plugin/. "$tmp/"
sed -i.bak 's|<version>1.0</version>|<version>2.0</version>|' "$tmp/plugin/config.xml"
rm "$tmp/plugin/config.xml.bak"
cat >> "$tmp/display_objects/greeting.cfm" <<'CFM'
<cfoutput>
	<p id="e2e-plugin-version">Plugin version 2.0</p>
</cfoutput>
CFM
(cd "$tmp" && zip -qr -X "$OLDPWD/test-plugin-v2.zip" . -x '.DS_Store')
echo "Built fixtures/test-plugin.zip and fixtures/test-plugin-v2.zip"
