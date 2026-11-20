@search
Feature: Search
  Visitors search the public site with the Site Search display object, and
  editors search the content in the Site Manager.

  Scenario: A visitor finds a page by its title
    Given I am logged in as an administrator
    And a page titled "Zebra crossing guide" with the body "Plain text" is published
    And a search page titled "Where to look"
    When a visitor searches for "Zebra crossing guide" on the search page "Where to look"
    Then the search finds the page "Zebra crossing guide"

  Scenario: A visitor finds a page by a word in its body
    Given I am logged in as an administrator
    And a page titled "Quiet page" with the body "A swims here narwhal<unique>" is published
    And a search page titled "Where to look"
    When a visitor searches for "narwhal<unique>" on the search page "Where to look"
    Then the search finds the page "Quiet page"

  Scenario: A search without a match finds nothing
    Given I am logged in as an administrator
    And a search page titled "Where to look"
    When a visitor searches for "nomatch<unique>zzz" on the search page "Where to look"
    Then the search finds nothing

  Scenario: Special characters and script in the search text are handled safely
    Given I am logged in as an administrator
    And a search page titled "Where to look"
    When a visitor searches for "<script>window.__searchXss=1</script>' OR 1=1 -- \"&%" on the search page "Where to look"
    Then the search runs no script from the search text

  Scenario: A very long search text is handled
    Given I am logged in as an administrator
    And a search page titled "Where to look"
    When a visitor searches for "long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long long" on the search page "Where to look"
    Then the search finds nothing

  Scenario: An editor finds content in the Site Manager
    Given I am logged in as an administrator
    And a page titled "Hidden gem" is published
    When I search the Site Manager for "Hidden gem <unique>"
    Then the Site Manager search lists the page "Hidden gem"
