# PUPScrape

This is a simple serverless project I wrote when my family and I were looking for a dog a couple years ago. The local shelter's website didn't have a great interface and had no way of notifying us when the dogs available to adopt had changed.

This serverless app ran a lambda function on a schedule, taking the list of dogs available on the site, creating a diff to isolate new additions and would send a text message to my wife and I letting us know there were new dogs to take a look at.

There's a companion UI that uses this information and displays it in a minimal way with the new dogs tagged.
