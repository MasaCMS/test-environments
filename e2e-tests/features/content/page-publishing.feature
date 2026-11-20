@content @admin
Feature: Page creation and publishing
  Administrators create pages with titles, body text and SEO settings,
  and publish them to the public site.

  Background:
    Given I am logged in as an administrator

  Scenario: Publishing a page with a custom URL and SEO settings
    When I publish a page titled "SEO page" with these details:
      | URL title        | seo-<unique>                |
      | HTML title       | Custom title <unique>       |
      | Meta description | Meta description <unique>   |
      | Summary          | Summary <unique>            |
      | Body             | <p>Body text <unique></p>   |
    And I open the public path "seo-<unique>/"
    Then the browser title contains "Custom title <unique>"
    And the meta description is "Meta description <unique>"
    And the page shows "Body text <unique>"

  Scenario: A title with special characters gets a clean URL
    When I publish a page titled "Café & Crème" with the body "Special characters"
    Then the page "Café & Crème" is visible on the public site

  Scenario: Publishing a page with very long content
    When I publish a page titled "Long page" with a body of 12000 characters ending in "END-OF-LONG-CONTENT"
    Then the page "Long page" is visible on the public site
    And the page shows "END-OF-LONG-CONTENT"

  Scenario: Publishing a nested page
    Given a page titled "Parent page" is published
    When I publish a page titled "Child page" under the page "Parent page"
    Then the page "Child page" is visible under "Parent page" on the public site

  Scenario: A draft is not on the public site until it is published
    When I save a draft of a page titled "Draft page"
    Then the page "Draft page" is not on the public site
    When I open and publish the draft "Draft page"
    Then the page "Draft page" is visible on the public site

  Scenario: A page scheduled for the future is not yet displayed
    When I publish a page titled "Scheduled page" to be displayed from "01/01/2099"
    Then the page "Scheduled page" is listed in the Site Manager
    And the page "Scheduled page" is not on the public site
