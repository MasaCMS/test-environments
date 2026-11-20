@changesets @admin
Feature: Change sets
  A change set collects content changes that go live together, either when
  an editor publishes it or on a date set in advance. Until then the public
  site does not show the changes, but a preview does.

  Background:
    Given I am logged in as an administrator

  Scenario: A change set is created
    When I create a change set named "Autumn campaign"
    Then the change set "Autumn campaign" is listed

  Scenario: A change set is scheduled for a publish date
    When I create a change set named "Winter sale" to be published on "12/31/2030"
    Then the change set "Winter sale" shows the publish date "12/31/2030"

  Scenario: A page saved to a change set waits for the change set to be published
    Given a change set named "Spring launch"
    When I save a new page titled "Launch page" to the change set "Spring launch"
    Then the change set "Spring launch" contains the page "Launch page"
    And the page "Launch page" is not on the public site for a visitor
    When I publish the change set "Spring launch"
    Then the change set "Spring launch" is published
    And the page "Launch page" is on the public site for a visitor

  Scenario: The preview of a change set shows what the public site does not
    Given a change set named "Preview set"
    When I save a new page titled "Preview page" to the change set "Preview set"
    Then the page "Preview page" is shown in the preview of the change set "Preview set"
    And the page "Preview page" is not on the public site for a visitor

  Scenario: A page removed from a change set is not published with it
    Given a change set named "Trimmed set"
    When I save a new page titled "Dropped page" to the change set "Trimmed set"
    And I remove the page "Dropped page" from the change set "Trimmed set"
    Then the change set "Trimmed set" no longer contains the page "Dropped page"
    When I publish the change set "Trimmed set"
    Then the page "Dropped page" is not on the public site for a visitor
