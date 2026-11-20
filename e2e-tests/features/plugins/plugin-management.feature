@plugins @admin
Feature: Plugin management
  Administrators change a plugin's settings, update it to a newer version,
  deactivate it and uninstall it.

  Background:
    Given I am logged in as an administrator
    And the E2E test plugin is installed and active on the default site

  Scenario: A changed plugin setting is saved
    When I change the setting "greeting" of the E2E test plugin to "Changed greeting"
    Then the setting "greeting" of the E2E test plugin is "Changed greeting"
    When I open the admin page of the E2E test plugin
    Then the plugin admin page shows the greeting "Changed greeting"

  Scenario: Updating a plugin to a newer version
    When I update the E2E test plugin to version 2
    Then the plugin list shows the E2E test plugin as version "2.0" by "E2E tests" in the category "Application"
    And the plugin list shows the E2E test plugin only once
    And the setting "greeting" of the E2E test plugin is "Hello from the E2E plugin"

  Scenario: Deactivating a plugin on a site
    When I deactivate the E2E test plugin on the default site
    Then the E2E test plugin is not listed under Site Plugins
    But the E2E test plugin is in the plugin list
    When I activate the E2E test plugin on the default site
    Then the E2E test plugin is listed under Site Plugins

  Scenario: Uninstalling a plugin removes it cleanly
    When I delete the E2E test plugin
    Then the E2E test plugin is not in the plugin list
    And the E2E test plugin is not listed under Site Plugins
    And the admin page of the E2E test plugin is gone
