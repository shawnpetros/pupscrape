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

module.exports.getPets = async () => {
  const {
    Items: [currDogs = { dogs: [] }],
  } = await getPetsFromDynamo();

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true,
    },
    body: JSON.stringify(
      {
        message: "jrpupsnstuff site parsed",
        dogList: currDogs,
      },
      null,
      2
    ),
  };
};

module.exports.writePets = async () => {
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
  const newDogIds = petsDiff(nextDogs, prevDogs.dogs).map((dog) => dog.id);
  const allDogs = prevDogs.reduce((acc, dog) => {
    if (newDogIds.includes(dog.id)) return [...acc, { ...dog, new: true }];
    return [...acc, dog];
  }, []);
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
