@layout @admin
Feature: Content collections
  The Collection display object lists content, limited by its settings.

  Background:
    Given I am logged in as an administrator
    And a page titled "Collection page" is published

  Scenario: Limiting the number of items in a collection
    When I open the page "Collection page" for inline editing
    And I add the "Collection" display object
    And I show at most 2 items in the Collection display object
    And I publish from the inline editor
    Then the public page "Collection page" lists 2 collection items

  Scenario: A collection made in the admin supplies the items
    When I create a collection named "Sorted collection" sorted by "title" "asc"
    Then the collection "Sorted collection" is listed in the Collections
    When I open the page "Collection page" for inline editing
    And I add the "Collection" display object
    And I use the collection "Sorted collection" as the source of the Collection display object
    And I publish from the inline editor
    Then the public page "Collection page" lists collection items in ascending title order
