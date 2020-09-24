const axios = require("axios");
const {
  getPetsFromIframeHTML,
  getIframeFromPetUrl,
  getPetsFromDynamo,
  savePetsToDynamo,
  deletePetsFromDynamo,
  petsDiff,
} = require("./helpers");

module.exports.getPets = async (event) => {
  const { data: petHTML } = await axios(
    "http://www.jrspupsnstuff.org/?page=allpups"
  );

  const iFrameUrl = getIframeFromPetUrl(petHTML);
  const { data: iFrameHTML } = await axios(iFrameUrl);
  const dogsToSave = getPetsFromIframeHTML(iFrameHTML);
  const {
    Items: [lastDogs = {}],
  } = await getPetsFromDynamo();
  await deletePetsFromDynamo(lastDogs.dogId);
  await savePetsToDynamo(dogsToSave);
  const newDogIds = petsDiff(dogsToSave, lastDogs.dogs).map((dog) => dog.id);

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: "jrpupsnstuff site parsed",
        dogList: dogsToSave,
        newDogIds,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
