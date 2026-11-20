@tags @admin
Feature: Tags
  Editors tag pages with free words. A folder lists its pages for a tag
  when visitors follow the tag.

  Background:
    Given I am logged in as an administrator

  Scenario: A tagged page shows on the tag page of its folder
    Given a folder "Kitchen" is published
    And these pages are published in the folder "Kitchen":
      | Title       | Tags          |
      | Pasta night | pasta<unique> |
      | Plain page  |               |
    Then the tag "pasta<unique>" of the folder "Kitchen" lists "Pasta night"
    And the tag "pasta<unique>" of the folder "Kitchen" does not list "Plain page"

  Scenario: A page can carry several tags
    Given a folder "Recipes" is published
    And these pages are published in the folder "Recipes":
      | Title      | Tags                       |
      | Soup guide | soup<unique>, warm<unique> |
      | Tea guide  | warm<unique>               |
    Then the tag "soup<unique>" of the folder "Recipes" lists "Soup guide"
    And the tag "soup<unique>" of the folder "Recipes" does not list "Tea guide"
    And the tag "warm<unique>" of the folder "Recipes" lists "Soup guide, Tea guide"

  Scenario: Changing the tags of a page
    Given a folder "Garden" is published
    And these pages are published in the folder "Garden":
      | Title       | Tags        |
      | Garden tips | old<unique> |
    When I change the page "Garden tips" in the folder "Garden" to have the categories "" and the tags "new<unique>"
    Then the tag "new<unique>" of the folder "Garden" lists "Garden tips"
    And the tag "old<unique>" of the folder "Garden" does not list "Garden tips"
