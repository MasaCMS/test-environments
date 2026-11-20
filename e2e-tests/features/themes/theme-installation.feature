@themes @admin
Feature: Theme installation
  A theme is a folder in the themes folder. Masa finds it when the application
  reloads, and administrators select it in the site settings.

  Background:
    Given I am logged in as an administrator
    And the test theme is in the themes folder

  Scenario: A theme in the themes folder is offered in the site settings
    Then the site settings offer the themes "default, e2etheme"
    And the site settings show the theme "default" as selected

  Scenario: Selecting a theme applies it to the public site
    When I select the theme "e2etheme" in the site settings
    Then the home page of the public site shows the test theme
    And the site settings show the theme "e2etheme" as selected

  Scenario: Switching back to the default theme
    Given the site uses the test theme
    When I select the theme "default" in the site settings
    Then the home page of the public site does not show the test theme

  Scenario: The selected theme survives an application reload
    Given the site uses the test theme
    When I reload the application to load the theme again
    Then the site settings show the theme "e2etheme" as selected
    And the home page of the public site shows the test theme
