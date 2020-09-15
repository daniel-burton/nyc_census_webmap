# nyc_census_webmap
This online map allows users to find their neighborhood's 2010 Census participation and sign up to volunteer in advance of the 2020 Census.
The decennial census determines apportionment of congressional seats, allocation of billions in federal funding, and guides the decisions of public health, planning, and transportation officials.
Our office, NYC Census 2020, was created to encourage census participation among New Yorkers, in addition to outreach performed by the federal Census Bureau.
Unfortunately, both the current political climate and generations of bad experiences with the government have made many distrust the census. Reasons for refusing to answer range from fear the information will be shared with immigration officials to sheer cynicism about the effectiveness of the government. For these two reasons-- distrust of the government and the importance of the census for local communities-- our program focused on community organizing at the neighborhood level, incorporating both volunteers and local service providers.

The map is currently live towards the bottom of the page at https://www.nyc.gov/census

In the course of creating this app I experienced technical problems setting up Git on my city-issued laptop, and so the revision history of this app is lost. 

This app has been expanded at various points to add additional functionality-- for instance, I created a version for the launch of our field program which directed users to the 5 "Census Teach Ins" closest to the address they searched. That version will be uploaded as a branch once I create a "dummy" JSON of sample events.

It relies on Leaflet.js, Leaflet-PIP (which allows leaflet to determine which geographies a given coordinate falls within on a layer), and the NYC Department of City Planning Geosearch API, which returns latitude and longitude given any address in New York City. That API also provides autocomplete functionality, which my search bar uses.

Sanity checks, functionality brainstorming, CSS wrangling, and 1AM Dunkin' runs were provided by George Zhuo, the NYC Census 2020 Data Director.

Please note that this app was created to run embedded on an NYC.GOV webpage in an Iframe, which led to a lot of compromises. For example, I would have loved to store additional map layers on a server which provided them on request (rather than forcing the user to download them all up front) but this was not possible.
