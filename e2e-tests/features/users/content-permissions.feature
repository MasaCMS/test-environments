@users @admin
Feature: Content permissions
  Group permissions decide what system users can see and edit in the Site Manager.

  Background:
    Given I am logged in as an administrator
    And a page titled "Open page" is published
    And a page titled "Closed page" is published
    And a system group "Page editors"
    And the group "Page editors" may use the Site Manager
    And a system user "Pat" in the group "Page editors"

  Scenario: Editor permission gives access to one page only
    When I give the group "Page editors" "Editor" permission on the page "Open page"
    And "Pat" logs in to the admin
    Then "Pat" sees the page "Open page" in the Site Manager
    And "Pat" can edit the page "Open page"
    And "Pat" does not see the page "Closed page" in the Site Manager

  Scenario: Permissions are inherited by child pages
    Given the group "Page editors" has "Editor" permission on the page "Open page"
    And a page titled "Child page" is published under the page "Open page"
    When "Pat" logs in to the admin
    Then "Pat" sees the page "Child page" under "Open page" in the Site Manager

  Scenario: Deny overrides an inherited permission
    Given the group "Page editors" has "Editor" permission on the page "Open page"
    And a page titled "Child page" is published under the page "Open page"
    When I give the group "Page editors" "Deny" permission on the page "Child page" under "Open page"
    And "Pat" logs in to the admin
    Then "Pat" sees the page "Open page" in the Site Manager
    And "Pat" does not see the page "Child page" under "Open page" in the Site Manager

  Scenario: The administrator sees all pages
    When I give the group "Page editors" "Deny" permission on the page "Closed page"
    Then the administrator sees the page "Closed page" in the Site Manager
