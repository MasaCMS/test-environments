@plugins @admin
Feature: Plugin installation
  Administrators install a plugin from a zip file, activate it for a site
  and open its admin page.

  Background:
    Given I am logged in as an administrator
    And the E2E test plugin is not installed

  Scenario: Installing a plugin by uploading its zip file
    When I install the E2E test plugin by uploading its zip file
    Then the plugin list shows the E2E test plugin as version "1.0" by "E2E tests" in the category "Application"
    And the setting "greeting" of the E2E test plugin is "Hello from the E2E plugin"

  Scenario: A plugin is not on a site until it is activated for it
    When I install the E2E test plugin by uploading its zip file
    Then the E2E test plugin is not listed under Site Plugins
    When I activate the E2E test plugin on the default site
    Then the E2E test plugin is listed under Site Plugins

  Scenario: An activated plugin has its own admin page
    Given the E2E test plugin is installed and active on the default site
    When I open the admin page of the E2E test plugin
    Then the plugin admin page shows the greeting "Hello from the E2E plugin"
