import React, { useState, useEffect } from "react";
import "./VideoControl.css"; 
import axios from "axios";

//let recordingTimeMS = 5000;
const apiBaseUrl = "http://localhost:3001"; 

function VideoControl() {
  const [videoMode, setVideoMode] = useState("recording");
  const [downloadButton, setDownloadButton] = useState({});
  const [users, setUsers] = useState([]);
  const [productions, setProductions] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [blob, setBlob] = useState(null);
  const [trackInfo, setTrackInfo] = useState({ trackName: "" });
  const [watchProduction, setWatchProduction] = useState("");
  const [watchTrack, setWatchTrack] = useState("");

  const chosenVideoTrack = watchTrack
    ? productions.find((production) => production.id == watchProduction).name +
      "/" +
      tracks.find((track) => track.id == watchTrack).name
    : "";

  const fetchData = async () => {
    const { data: users } = await axios.get(apiBaseUrl + "/api/users");
    setUsers(users);
    const { data: productions } = await axios.get(
      apiBaseUrl + "/api/productions"
    );
    setProductions(productions);
    const { data: tracks } = await axios.get(apiBaseUrl + "/api/tracks");
    setTracks(tracks);
  };

  useEffect(() => {
    fetchData();
  }, []);

  console.log(
    "USERS:",
    users,
    "PRODUCTIONS: ",
    productions,
    "TRACKS: ",
    tracks
  );
  console.log("TRACKINFO", trackInfo);
  console.log("WATCH PRODUCTION & TRACK", watchProduction, watchTrack);


  /* function wait(delayInMS) {
    return new Promise(resolve => setTimeout(resolve, delayInMS));
  } */

  function startRecording(stream, lengthInMS) {
    let recorder = new MediaRecorder(stream);
    let data = [];

    recorder.ondataavailable = (event) => data.push(event.data);
    recorder.start();
   console.log(recorder.state + " for " + lengthInMS / 1000 + " seconds...");

    let stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (event) => reject(event.name);
    });

    /* let recorded = wait(lengthInMS).then(
      () => recorder.state == "recording" && recorder.stop()
    ); */

    return Promise.all([
      stopped,
      // recorded
    ]).then(() => data);
  }

  function stop(stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  const handleStartButton = () => {
    setVideoMode("recording");
    let preview = document.getElementById("preview");
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        console.log("STREAM", stream);
        preview.srcObject = stream;
        setDownloadButton({ ...downloadButton, href: stream });
        preview.captureStream =
          preview.captureStream || preview.mozCaptureStream;
        return new Promise((resolve) => (preview.onplaying = resolve));
      })
      .then(() =>
        startRecording(preview.captureStream() /* , recordingTimeMS */)
      )
      .then((recordedChunks) => {
        let recordedBlob = new Blob(recordedChunks, { type: "video/mp4" });
        console.log("BLOBBI", recordedBlob);
        setBlob(recordedBlob);
        let recording = document.getElementById("recording");
        recording.src = URL.createObjectURL(recordedBlob);
        setDownloadButton({
          download: "RecordedVideo.webm",
          href: recording.src,
        });

       console.log(
          "Successfully recorded " +
            recordedBlob.size +
            " bytes of " +
            recordedBlob.type +
            " media."
        );
      })
      .catch(console.log);
  };
  const handleStopButton = () => {
    let preview = document.getElementById("preview");
    stop(preview.srcObject);
    setVideoMode("playLocal");
  };

  const handleUploadButton = async () => {
    console.log("UPLOADING", downloadButton);
    const name =
      productions.find((production) => production.id == trackInfo.productionId)
        .name +
      "_" +
      trackInfo.trackName;
    const file = new File([blob], name, {
      lastModified: new Date(),
      type: "video/webm",
    });
    console.log("UUSI FILEE", file);
    const formData = new FormData();
    formData.append("file", file);

    let options = {
      url: apiBaseUrl + "/api/files",
      method: "POST",
      data: formData,
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    };

    const { data: newFile } = await axios(options).catch(console.log);
    console.log("NEW FILE", newFile.data);
    const { data: newTrack } = await axios
      .post(apiBaseUrl + "/api/tracks", {
        url: newFile.data.url,
        userId: "1234",
        productionId: trackInfo.productionId,
        name: trackInfo.trackName,
      })
      .catch(console.log);
    console.log("NEW TRACK", newTrack);
    setTracks(tracks.concat(newTrack));
  };

  const handlePlayVideo = () => {
    console.log("PLAYING VIDEO");
    setVideoMode("playRemote");
    let playRemote = document.getElementById("playRemote");
    playRemote.src =
      "http://localhost:3001" +
      tracks.find((track) => track.id == watchTrack).url;
  };

  return (
    <div className="block videoBlock">
      <div style={{ display: videoMode === "recording" ? "block" : "none" }}>
        <video id="preview" width="270" height="200" autoPlay muted></video>
      </div>
      <div style={{ display: videoMode === "playLocal" ? "block" : "none" }}>
        <video id="recording" width="270" height="200" controls></video>
      </div>
      <div style={{ display: videoMode === "playRemote" ? "block" : "none" }}>
        <video id="playRemote" width="270" height="200" autoPlay></video>
      </div>
      <div className="videoButtons">
        <button onClick={() => handleStartButton()}>REC</button>
        <button onClick={() => handleStopButton()}>STOP</button>
        <button>
          <a
            id="downloadButton"
            href={downloadButton.href}
            download={downloadButton.download}
          >
            DOWNLOAD{" "}
          </a>
        </button>
      </div>
      <div className="titleRow">
        TRACK NAME
        <input
          type="text"
          value={trackInfo.trackName}
          onChange={({ target }) =>
            setTrackInfo({ ...trackInfo, trackName: target.value })
          }
        />
      </div>
      <div className="titleRow">
        SONG
        <select
          value={trackInfo.productionId}
          onChange={({ target }) =>
            setTrackInfo({ ...trackInfo, productionId: target.value })
          }
        >
          <option>valitse</option>
          {productions.map((production) => (
            <option key={production.id} value={production.id}>
              {production.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          id="uploadButton"
          onClick={() => handleUploadButton()}
        >
          UPLOAD
        </button>
      </div>
      {/* <div id="divider"></div> */}
      <br/><br/><br/>
      PLAYBACK
      <div className="titleRow">
        UPLOADED SONGS
        <select
          value={watchProduction}
          onChange={({ target }) => setWatchProduction(target.value)}
        >
          <option>valitse</option>
          {productions.map((production) => (
            <option key={production.id} value={production.id}>
              {production.name}
            </option>
          ))}
        </select>
      </div>
      {watchProduction && (
        <div className="titleRow">
          TRACK
          <select
            value={watchTrack}
            onChange={({ target }) => setWatchTrack(target.value)}
          >
            <option>valitse</option>
            {tracks
              .filter((track) => track.productionId == watchProduction)
              .map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
          </select>
          {watchTrack && (
            <button type="button" onClick={handlePlayVideo}>
              PLAY {chosenVideoTrack}{" "}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default VideoControl;
