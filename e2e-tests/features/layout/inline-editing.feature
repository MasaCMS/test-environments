@layout @admin
Feature: Front-end inline editing
  Administrators add, reorder and remove display objects on the page itself.

  Background:
    Given I am logged in as an administrator
    And a page titled "Layout page" is published

  Scenario: Adding a display object to a region
    When I open the page "Layout page" for inline editing
    Then the inline editor offers the display objects "Button, Collection, Navigation, Site Search, Text"
    When I add the "Site Search" display object
    And I publish from the inline editor
    Then the public page "Layout page" shows the display objects "Site Search"

  Scenario: Reordering display objects by dragging
    When I open the page "Layout page" for inline editing
    And I add the "Site Search" display object
    And I add the "Navigation" display object above the "Site Search" display object
    Then the main content region holds the display objects "Navigation, Site Search"
    When I publish from the inline editor
    Then the public page "Layout page" shows the display objects "Navigation, Site Search"

  Scenario: Removing a display object
    When I open the page "Layout page" for inline editing
    And I add the "Site Search" display object
    And I remove the "Site Search" display object
    And I publish from the inline editor
    Then the public page "Layout page" shows no display objects
