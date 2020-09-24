const axios = require("axios");
const {
  getPetsFromIframeHTML,
  getIframeFromPetUrl,
  getPetsFromDynamo,
  savePetsToDynamo,
  deletePetsFromDynamo,
  petsDiff,
  mergeNewPets,
} = require("./helpers");

module.exports.getPets = async (event) => {
  const { data: petHTML } = await axios(
    "http://www.jrspupsnstuff.org/?page=allpups"
  );

  const iFrameUrl = getIframeFromPetUrl(petHTML);
  const { data: iFrameHTML } = await axios(iFrameUrl);
  const nextDogs = getPetsFromIframeHTML(iFrameHTML);
  const {
    Items: [prevDogs = { dogs: [] }],
  } = await getPetsFromDynamo();
  const newDogs = petsDiff(nextDogs, prevDogs.dogs);
  const newDogIds = newDogs.map((dog) => dog.id);
  const allDogs = mergeNewPets(newDogs, prevDogs.dogs);

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(
      {
        message: "jrpupsnstuff site parsed",
        dogList: allDogs,
        newDogIds,
      },
      null,
      2
    ),
  };
};

module.exports.writePets = async (event) => {
  const { data: petHTML } = await axios(
    "http://www.jrspupsnstuff.org/?page=allpups"
  );

  const iFrameUrl = getIframeFromPetUrl(petHTML);
  const { data: iFrameHTML } = await axios(iFrameUrl);
  const nextDogs = getPetsFromIframeHTML(iFrameHTML);
  const {
    Items: [prevDogs = { dogs: [] }],
  } = await getPetsFromDynamo();
  await deletePetsFromDynamo(prevDogs.dogId);
  const newDogs = petsDiff(nextDogs, prevDogs.dogs);
  const allDogs = mergeNewPets(newDogs, prevDogs.dogs);
  await savePetsToDynamo(allDogs);

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(
      {
        message: "jrpupsnstuff site parsed",
      },
      null,
      2
    ),
  };
};
