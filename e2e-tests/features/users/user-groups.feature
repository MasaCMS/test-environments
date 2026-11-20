@users @admin
Feature: Group management
  System groups hold admin users; member groups hold the visitors who log in on the public site.

  Background:
    Given I am logged in as an administrator

  Scenario: Creating a system group
    When I create a system group "Reviewers"
    Then the system group "Reviewers" is listed

  Scenario: Creating a member group
    When I create a member group "Subscribers"
    Then the member group "Subscribers" is listed
