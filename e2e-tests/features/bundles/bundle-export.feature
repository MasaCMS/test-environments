@bundles @admin
Feature: Site bundles
  An administrator exports a site, with its content and files, as a bundle
  and can choose what else goes in it.

  Background:
    Given I am logged in as an administrator

  Scenario: A site bundle is downloaded and holds the site's content
    Given a page titled "Bundled page" is published
    When I create a site bundle
    Then the bundle is downloaded as a zip file named like "MuraBundle_default_.*\.zip"
    And the bundle contains the page "Bundled page"
    And the bundle contains the site files

  Scenario: Users are only in the bundle when asked for
    When I create a site bundle
    Then the bundle does not contain the file "wddx_rstusers.xml"
    When I create a site bundle including the site members and administrative users
    Then the bundle contains the file "wddx_rstusers.xml"

  Scenario: The deploy page offers what to import
    When I open the Deploy Bundle tab of the site settings
    Then the deploy options offer "Site Architecture & Content"
    And the deploy options offer "Site Members & Administrative Users"
