@categories @admin
Feature: Categories
  Administrators organise content in categories, nested to any depth.
  A folder lists its pages for a category when visitors follow the category.

  Background:
    Given I am logged in as an administrator

  Scenario: Creating a category
    When I create the category "News"
    Then the category "News" is listed

  Scenario: Creating a nested category
    Given a category "Products" exists
    When I create the category "Gadgets" under "Products"
    Then the category "Gadgets" is listed below the category "Products"

  Scenario: A folder lists the pages of a category
    Given a category "Reviews" exists
    And a category "Interviews" exists
    And a folder "Magazine" is published
    And these pages are published in the folder "Magazine":
      | Title        | Categories |
      | Phone review | Reviews    |
      | Star talk    | Interviews |
      | Plain page   |            |
    Then the folder "Magazine" lists "Phone review, Star talk, Plain page"
    And the category "Reviews" of the folder "Magazine" lists "Phone review"
    And the category "Reviews" of the folder "Magazine" does not list "Star talk, Plain page"
    And the category "Interviews" of the folder "Magazine" lists "Star talk"
    And the category "Interviews" of the folder "Magazine" does not list "Phone review, Plain page"

  Scenario: A page can be in several categories
    Given a category "Sport" exists
    And a category "Health" exists
    And a folder "Wellbeing" is published
    And these pages are published in the folder "Wellbeing":
      | Title         | Categories    |
      | Running guide | Sport, Health |
      | Chess column  | Sport         |
    Then the category "Sport" of the folder "Wellbeing" lists "Running guide, Chess column"
    And the category "Health" of the folder "Wellbeing" lists "Running guide"
    And the category "Health" of the folder "Wellbeing" does not list "Chess column"

  Scenario: Changing the categories of a page
    Given a category "Old topic" exists
    And a category "New topic" exists
    And a folder "Archive" is published
    And these pages are published in the folder "Archive":
      | Title      | Categories |
      | Moving day | Old topic  |
    When I change the page "Moving day" in the folder "Archive" to have the categories "New topic" and the tags ""
    Then the category "New topic" of the folder "Archive" lists "Moving day"
    And the category "Old topic" of the folder "Archive" does not list "Moving day"

  Scenario: Deleting a category
    Given a category "Temporary" exists
    When I delete the category "Temporary"
    Then the category "Temporary" is not listed
