@admin
Feature: Creating pages
  Administrators create and publish pages that appear on the public site.

  Scenario: Publishing a new page
    Given I am logged in as an administrator
    When I create and publish a page titled "About us"
    Then the page "About us" is visible on the public site
