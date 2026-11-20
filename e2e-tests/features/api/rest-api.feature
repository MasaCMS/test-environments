@api
Feature: JSON API
  Other systems read and change content through the JSON API. What anyone
  may read is open, what changes content needs a signed-in user with
  permission.

  Scenario: Anyone can list published content
    When I request "/content?maxItems=2" from the API without signing in
    Then the API answers with status 200 and JSON
    And the API answer lists "content" content

  Scenario: Anyone can read one page by its id
    When I request "/content/00000000000000000000000000000000001?fields=title" from the API without signing in
    Then the API answers with status 200 and JSON
    And the API answer says "Home"

  Scenario: User data is not open to the public
    When I request "/user?maxItems=1" from the API without signing in
    Then the API answers with status 401 and JSON
    And the API answer says "Insufficient Account Permissions"

  Scenario: A request to an unknown entity gets a JSON error
    When I request "/doesnotexist" from the API without signing in
    Then the API answers with status 400 and JSON
    And the API answer says "error"

  Scenario: A wrong password does not sign in
    Given the API client is ready
    When I sign in to the API as "admin" with the password "not-the-password"
    Then the API sign-in fails

  Scenario: Content cannot be created without signing in
    Given the API client is ready
    When I create the page "Unsaved page" through the API
    Then the API refused to save the page

  Scenario: Content is created, changed and deleted through the API
    Given the API client is ready
    When I sign in to the API as "admin" with the password "admin"
    Then the API sign-in succeeds
    When I create the page "Api page" through the API
    Then the API finds the page "Api page"
    And the page "Api page" is on the public site for a visitor through its API address
    When I rename the page "Api page" through the API to "Api page renamed"
    Then the API finds the page "Api page renamed"
    When I delete the page "Api page" through the API
    Then the API does not find the page "Api page renamed"
    And the page "Api page renamed" is gone from the public site for a visitor
