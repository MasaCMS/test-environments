@plugins @admin
Feature: Plugin display objects
  A plugin can supply display objects that administrators add to a page
  with the layout manager.

  Background:
    Given I am logged in as an administrator
    And the E2E test plugin is installed and active on the default site
    And a page titled "Plugin page" is published

  Scenario: Adding a plugin display object to a page
    When I open the page "Plugin page" for inline editing
    And I add the plugin display object "E2E Greeting" of "E2E Test Plugin"
    And I publish from the inline editor
    Then the public page "Plugin page" shows the plugin text "Hello from the E2E plugin"

  Scenario: The display object follows the plugin's settings
    When I open the page "Plugin page" for inline editing
    And I add the plugin display object "E2E Greeting" of "E2E Test Plugin"
    And I publish from the inline editor
    And I change the setting "greeting" of the E2E test plugin to "Settings changed"
    Then the public page "Plugin page" shows the plugin text "Settings changed"

  Scenario: A page keeps working after its plugin is uninstalled
    When I open the page "Plugin page" for inline editing
    And I add the plugin display object "E2E Greeting" of "E2E Test Plugin"
    And I publish from the inline editor
    And I delete the E2E test plugin
    Then the public page "Plugin page" does not show the plugin text "Hello from the E2E plugin"
