@performance
Feature: Performance benchmarks
  The test plan sets limits for how long Masa may take: public pages under
  3 seconds and under 1 second when they are served again, and admin
  pages under 2 seconds. Each measurement is taken
  three times and the fastest counts.

  Scenario: The home page loads in less than 3 seconds
    When I load the home page 3 times
    Then the fastest "home page" takes less than 3 seconds

  Scenario: The server answers the home page in less than 1 second when it is asked again
    When I ask the server for the home page 3 times
    Then the fastest "home page request" takes less than 1 seconds

  Scenario: A page with a lot of content loads in less than 3 seconds
    Given I am logged in as an administrator
    And I publish a page titled "Long read" with a body of 20000 characters ending in "The end"
    When I load the page "Long read" 3 times
    Then the fastest "Long read" takes less than 3 seconds

  Scenario: The Site Manager opens in less than 2 seconds
    Given I am logged in as an administrator
    When I load the Site Manager 3 times
    Then the fastest "Site Manager" takes less than 2 seconds
