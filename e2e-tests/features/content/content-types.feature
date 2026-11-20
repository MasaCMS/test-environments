@content @admin
Feature: Content types
  Each default content type can be created and published.

  Background:
    Given I am logged in as an administrator

  Scenario Outline: Publishing a <type> item
    When I publish a <type> titled "<type> item"
    Then the page "<type> item" is visible on the public site

    Examples:
      | type     |
      | Folder   |
      | Calendar |
      | Gallery  |

  Scenario: A Link item redirects visitors to its address
    When I publish a Link titled "Link item" pointing to "https://example.com/"
    Then the page "Link item" redirects visitors to "https://example.com/"
