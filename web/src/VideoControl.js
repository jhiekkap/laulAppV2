import React, { useState, useEffect, useRef } from "react";
import "./VideoControl.css";
import axios from "axios";

//const recordingTimeMS = 5000;
const apiBaseUrl = "http://localhost:3001";

const VideoControl = () => {
  const [videoMode, setVideoMode] = useState("recording");
  const [downloadButton, setDownloadButton] = useState({});
  const [_users, setUsers] = useState([]);
  const [songs, setSongs] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [blob, setBlob] = useState(null);
  const [trackInfo, setTrackInfo] = useState({ trackName: "" });
  const [chosenSong, setChosenSong] = useState("");
  const [chosenTrack, setChosenTrack] = useState("");

  const previewRef = useRef();
  const recordingRef = useRef();
  const playRemoteRef = useRef();

  const chosenVideoTrack = chosenTrack
    ? songs.find((song) => song.id === chosenSong).name +
      "/" +
      tracks.find((track) => track.id === chosenTrack).name
    : "";

  const fetchData = async () => {
    try {
      const { data: users } = await axios.get(apiBaseUrl + "/api/users");
      setUsers(users);
      const { data: songs } = await axios.get(apiBaseUrl + "/api/songs");
      setSongs(songs);
      const { data: tracks } = await axios.get(apiBaseUrl + "/api/tracks");
      setTracks(tracks);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // console.log(
  //   "USERS:",
  //   users,
  //   "PRODUCTIONS: ",
  //   songs,
  //   "TRACKS: ",
  //   tracks
  // );
  // console.log("TRACKINFO", trackInfo);
  // console.log("WATCH PRODUCTION & TRACK", chosenSong , chosenTrack );

  /* function wait(delayInMS) {
    return new Promise(resolve => setTimeout(resolve, delayInMS));
  } */

  const startRecording = async (stream, lengthInMS) => {
    const recorder = new MediaRecorder(stream);
    const data = [];

    recorder.ondataavailable = (event) => {
      console.log(event.data, Date.now());
      data.push(event.data);
    };
    recorder.start();
    // console.log(recorder.state + " for " + lengthInMS / 1000 + " seconds...");

    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (event) => reject(event.name);
    });

    /* const recorded = wait(lengthInMS).then(
      () => recorder.state === "recording" && recorder.stop()
    ); */

    await Promise.all([
      stopped,
      //recorded,
    ]);
    return data;
  };

  const stop = (stream) => {
    stream.getTracks().forEach((track) => track.stop());
  };

  const handleStartButton = async () => {
    setVideoMode("recording");
    const preview = previewRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      preview.srcObject = stream;
      setDownloadButton({ ...downloadButton, href: stream });
      preview.captureStream = preview.captureStream || preview.mozCaptureStream;
      await new Promise((resolve) => (preview.onplaying = resolve));
      const recordedChunks = await startRecording(
        preview.captureStream() /* , recordingTimeMS */
      );
      const recordedBlob = new Blob(recordedChunks, { type: "video/mp4" });
      // console.log("BLOBBI", recordedBlob);
      setBlob(recordedBlob);
      const recording = recordingRef.current;
      recording.src = URL.createObjectURL(recordedBlob);
      setDownloadButton({
        download: "RecordedVideo.webm",
        href: recording.src,
      });
      // console.log(
      //   "Successfully recorded " +
      //     recordedBlob.size +
      //     " bytes of " +
      //     recordedBlob.type +
      //     " media."
      // );
      // })
    } catch (error) {
      console.log(error);
    }
  };

  const handleStopButton = () => {
    const preview = previewRef.current;
    stop(preview.srcObject);
    setVideoMode("playLocal");
  };

  const handleUploadButton = async () => {
    // console.log("UPLOADING", downloadButton);

    const name =
      songs.find((song) => song.id === trackInfo.songId).name +
      "_" +
      trackInfo.trackName;

    const file = new File([blob], name, {
      lastModified: new Date(),
      type: "video/webm",
    });
    // console.log("UUSI FILEE", file);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data: newFile } = await axios({
        url: apiBaseUrl + "/api/files",
        method: "POST",
        data: formData,
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("NEW FILE", newFile.data);

      const { data: newTrack } = await axios.post(apiBaseUrl + "/api/tracks", {
        url: newFile.data.url,
        userId: "1234",
        songId: trackInfo.songId,
        name: trackInfo.trackName,
      });

      // console.log("NEW TRACK", newTrack);
      // fetchData();
      setTracks(tracks.concat(newTrack));
    } catch (error) {
      console.log(error);
    }
  };

  const handlePlayVideo = () => {
    setVideoMode("playRemote");
    const playRemote = playRemoteRef.current;
    playRemote.src = `http://localhost:3001${
      tracks.find((track) => track.id === chosenTrack).url
    }`;
  };

  return (
    <div className="block videoBlock">
      <div style={{ display: videoMode === "recording" ? "block" : "none" }}>
        <video
          ref={previewRef}
          id="preview"
          width="270"
          height="200"
          autoPlay
          muted
        ></video>
      </div>
      <div style={{ display: videoMode === "playLocal" ? "block" : "none" }}>
        <video
          ref={recordingRef}
          id="recording"
          width="270"
          height="200"
          controls
        ></video>
      </div>
      <div style={{ display: videoMode === "playRemote" ? "block" : "none" }}>
        <video
          ref={playRemoteRef}
          id="playRemote"
          width="270"
          height="200"
          autoPlay
        ></video>
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
            DOWNLOAD
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
          value={trackInfo.songId}
          onChange={({ target }) => {
            setTrackInfo({ ...trackInfo, songId: target.value });
          }}
          placeholder="valitse"
        >
          {songs.map((song) => (
            <option key={song.id} value={song.id}>
              {song.name}
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
      <br />
      <br />
      <br />
      PLAYBACK
      <div className="titleRow">
        UPLOADED SONGS
        <select
          value={chosenSong}
          onChange={({ target }) => setChosenSong(target.value)}
          placeholder="valitse"
        >
          {songs.map((song) => (
            <option key={song.id} value={song.id}>
              {song.name}
            </option>
          ))}
        </select>
      </div>
      {chosenSong && (
        <div className="titleRow">
          TRACK
          <select
            value={chosenTrack}
            onChange={({ target }) => setChosenTrack(target.value)}
            placeholder="valitse"
          >
            {tracks
              .filter((track) => track.songId === chosenSong)
              .map((track) => (
                <option key={track.id} value={track.id}>
                  {track.name}
                </option>
              ))}
          </select>
          {chosenTrack && (
            <button type="button" onClick={handlePlayVideo}>
              PLAY {chosenVideoTrack}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoControl;
