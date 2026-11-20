@users @admin
Feature: User account management
  Administrators create user accounts and groups, and control who can log in.

  Background:
    Given I am logged in as an administrator

  Scenario: Creating a system user in a group
    Given a system group "Content team"
    When I create a system user "Ellen" in the group "Content team"
    Then the system user "Ellen" is listed
    And the system group "Content team" has 1 member
    When "Ellen" logs in to the admin
    Then "Ellen" is logged in to the admin

  Scenario: A system user without permissions has no access to the Site Manager
    When I create a system user "Nobody"
    And "Nobody" logs in to the admin
    Then "Nobody" has no access to the Site Manager

  Scenario: Creating a site member
    When I create a site member "Visitor"
    Then the site member "Visitor" is listed

  Scenario: A user with special characters in the name
    When I create a system user "Special" with the last name "O'Brien-Smith ë <unique>"
    Then the system user "Special" is listed

  Scenario: A username can only be used once
    When I create a system user "Original"
    And I create another user with the same username as "Original"
    Then the user form refuses the username as already used
    And only one user has the username of "Original"

  Scenario: An inactive user cannot log in
    When I create an inactive system user "Dormant"
    And "Dormant" logs in to the admin
    Then "Dormant" is refused at the admin login

  Scenario: A user in several groups
    Given a system group "Group one"
    And a system group "Group two"
    When I create a system user "Busy" in the groups "Group one" and "Group two"
    Then the system group "Group one" has 1 member
    And the system group "Group two" has 1 member
