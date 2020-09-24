const cheerio = require("cheerio");
const AWS = require("aws-sdk");
const Twilio = require("twilio");
const { differenceBy } = require("lodash");
const dynamo = new AWS.DynamoDB.DocumentClient();

async function sendTwilioTextMessage(numDogs) {
  const client = new Twilio("<account_id>", "<account_secret>");

  await client.messages.create({
    to: "<phone_number>",
    message: "this is a test",
  });
}

function getPetsFromDynamo() {
  return dynamo
    .scan({
      TableName: "jrpupsnstuffdogs",
    })
    .promise();
}

function deletePetsFromDynamo(idToDelete) {
  if (idToDelete) {
    return dynamo
      .delete({
        TableName: "jrpupsnstuffdogs",
        Key: {
          dogId: idToDelete,
        },
      })
      .promise();
  } else return;
}

function savePetsToDynamo(dogs) {
  return dynamo
    .put({
      TableName: "jrpupsnstuffdogs",
      Item: {
        dogId: new Date().toString(),
        dogs,
      },
    })
    .promise();
}

function petsDiff(newPets, oldPets) {
  return differenceBy(newPets, oldPets, "id");
}

function mergeNewPets(newPets, oldPets) {
  // console.log({ newPets, oldPets });
  return [...oldPets, ...newPets];
}

function getIframeFromPetUrl(html) {
  const $ = cheerio.load(html);
  const iFrameUrl = $("iframe").attr("src");
  return iFrameUrl;
}

function getPetsFromIframeHTML(html) {
  const $ = cheerio.load(html);
  const dogs = [];
  $(".list-item").each((index, dogInfoBlock) => {
    const id = $(".list-animal-id", dogInfoBlock).text();
    if (!id) return;
    const url = `http://ws.petango.com/webservices/adoptablesearch/wsAdoptableAnimalDetails.aspx?id=${id}`;
    const photo = $(".list-animal-photo", dogInfoBlock)
      .attr("src")
      .replace("_TN1", ""); // remove the thumbnail declaration
    const name = $("a", dogInfoBlock).text();
    const [sex, spayedNeutered] = $(".list-animal-sexSN", dogInfoBlock)
      .text()
      .split("/");
    const breed = $(".list-animal-breed", dogInfoBlock).text();
    const age = $(".list-animal-age", dogInfoBlock).text();
    dogs[index] = {
      dateAdded: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      id,
      url,
      photo,
      name,
      sex,
      spayedNeutered,
      breed,
      age,
    };
  });

  return dogs;
}

module.exports = {
  getPetsFromIframeHTML,
  getIframeFromPetUrl,
  getPetsFromDynamo,
  savePetsToDynamo,
  deletePetsFromDynamo,
  petsDiff,
  mergeNewPets,
  sendTwilioTextMessage,
};
