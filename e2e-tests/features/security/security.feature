@web-security
Feature: Security
  The admin keeps strangers out, does not run what visitors or editors type
  as script, and does not act on links that were not made by the admin.

  Scenario: Repeated wrong passwords lock the account
    Given I am logged in as an administrator
    And a system group "Lockers"
    And a system user "Locked out" in the group "Lockers"
    When "Locked out" tries to log in to the admin with a wrong password 10 times
    And "Locked out" logs in to the admin with the right password again
    Then "Locked out" is not logged in to the admin

  Scenario: The login does not tell an unknown user from a wrong password
    When someone tries to log in with an unknown user name and a password
    And someone tries to log in as the administrator with a wrong password
    Then both attempts get the same answer

  Scenario: The admin needs a login
    When a visitor without a session opens the admin address "/admin/?muraAction=cArch.list&siteid=default"
    Then the visitor is asked to log in

  Scenario: A script in the title of a page is not run
    Given I am logged in as an administrator
    When I publish a page titled "<script>window.__titleXss=1</script>" with these details:
      | URL title | xss-title-<unique> |
    Then the script in the title of the page at "xss-title-<unique>/" is not run on the public site

  Scenario: A delete link without a security token does nothing
    Given I am logged in as an administrator
    And a page titled "Keep me" is published
    When a delete link for the page "Keep me" is opened without a security token
    Then the page "Keep me" is still there
