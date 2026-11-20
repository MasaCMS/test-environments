@content @admin
Feature: Content versioning
  Every publish keeps the previous version in the version history, and an
  old version can be published again.

  Scenario: Editing keeps history and an old version can be restored
    Given I am logged in as an administrator
    And a page titled "Versioned page" with the body "Version one" is published
    When I edit the page "Versioned page" and publish it with the body "Version two"
    Then the page "Versioned page" shows "Version two" inside a "p" element
    When I open the version history of the page "Versioned page"
    Then the version history lists 1 published and 1 archived versions
    When I publish the oldest archived version again
    Then the page "Versioned page" shows "Version one" inside a "p" element
