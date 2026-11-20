@caching @admin
Feature: Caching
  With caching on, Masa serves public pages from its cache. Changes to
  content must still show up, and reloading the application clears every
  cache.

  Background:
    Given I am logged in as an administrator

  Scenario: Site caching is switched on and off
    When I switch site caching on
    Then the site settings show site caching on
    And the admin does not warn about caching
    When I switch site caching off
    Then the site settings show site caching off
    And the admin warns that caching is off

  Scenario: A page that changed shows its new content with caching on
    Given site caching is switched on
    And a page titled "Cached page" with the body "First version <unique>" is published
    Then a visitor sees "First version <unique>" on the page "Cached page"
    When I edit the page "Cached page" and publish it with the body "Second version <unique>"
    Then a visitor sees "Second version <unique>" on the page "Cached page"
    And a visitor does not see "First version <unique>" on the page "Cached page"

  Scenario: Reloading the application from the admin menu keeps the site working
    Given site caching is switched on
    And a page titled "Reload menu page" with the body "Still here <unique>" is published
    When I reload the application from the admin menu
    Then a visitor sees "Still here <unique>" on the page "Reload menu page"

  Scenario: Reloading the application with the URL parameter keeps the site working
    Given site caching is switched on
    And a page titled "Reload url page" with the body "Still here too <unique>" is published
    When I reload the application with the URL parameter
    Then a visitor sees "Still here too <unique>" on the page "Reload url page"
