# ReddUX -- Reddit UX featurepack for new reddit design
**⚠️ Early alpha! Lacks features, eats RAM, but works.**

ReddUX uses new json api features of reddit redesign to catch and filter posts in your feed.

## Features
* Ignore users
* Ignore subreddits
* Track read posts
* Hide read posts 
  * This will force reddit to load next bunches of posts until if finds something you did not read

## Known bugs:
* Hides posts after you upvote it in feed.
  * Workaround: open post and then upvote it
* Hides read posts in user's profiles
* RAM consumption: when hiding read posts i'm removing post from DOM entirely, but it seems like there's some copy of it, maybe some kind of shadow DOM.
  * Should be fixed when I'll have time to debug reddit's internal scripts
  
## Installation
* Install Tampermonkey addon, it runs userscripts
* Go to TamperMonkey options and press + at top right corder
* Copypaste ReddUX.js contents into opened text field

## TODO
* Bugfixes
* Fancy installation button
* ...
