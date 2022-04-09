import React, { useState, useEffect, useRef } from "react";
import "./VideoControl.css";
import axios from "axios";
import { stringify } from "querystring";

//const recordingTimeMS = 5000;
const apiBaseUrl = "http://localhost:3001";

type Song = {
  id: string;
  name: string;
};

type Track = {
  id: string;
  name: string;
  songId: string;
  url: string;
}

type TrackInfo = {
  trackName: string;
  songId?: string;
}

type DownLoadButton = { href: string; download: string } & {};

// interface HTMLMediaElementWithCaptureStream extends HTMLVideoElement {
//   captureStream(): MediaStream;
//   mozCaptureStream(): MediaStream;
// }

const VideoControl = () => {
  const [videoMode, setVideoMode] = useState("recording");
  const [downloadButton, setDownloadButton] = useState<DownLoadButton>({ href: '', download: '' });
  const [_users, setUsers] = useState([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [trackInfo, setTrackInfo] = useState<TrackInfo>({ trackName: "" });
  const [chosenSong, setChosenSong] = useState<string | undefined>();
  const [chosenTrack, setChosenTrack] = useState<string | undefined>();

  const previewRef = useRef<any>();
  const recordingRef = useRef<any>();
  const playRemoteRef = useRef<any>(); // HTMLMediaElementWithCaptureStream

  const chosenVideoTrack = chosenTrack
    ? songs.find((song) => song.id === chosenSong)?.name +
    "/" +
    tracks.find((track) => track.id === chosenTrack)?.name
    : "";

  const fetchData = async () => {
    try {
      const { data: dbUsers } = await axios.get(apiBaseUrl + "/api/users");
      setUsers(dbUsers);
      const { data: dbSongs } = await axios.get(apiBaseUrl + "/api/songs");
      setSongs(dbSongs);
      if (!chosenSong) {
        setChosenSong(dbSongs[0].id);
        setTrackInfo({ ...trackInfo, songId: dbSongs[0].id })
      }
      const { data: dbTracks } = await axios.get(apiBaseUrl + "/api/tracks");
      setTracks(dbTracks);
      if (!chosenTrack) {
        setChosenTrack(dbTracks[0].id);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* function wait(delayInMS) {
    return new Promise(resolve => setTimeout(resolve, delayInMS));
  } */

  const startRecording = async (stream: MediaStream, _lengthInMS?: number) => {
    const recorder = new MediaRecorder(stream);
    const data: Blob[] = [];

    recorder.ondataavailable = (event) => {
      console.log(event.data, Date.now());
      data.push(event.data);
    };
    recorder.start();
    // console.log(recorder.state + " for " + lengthInMS / 1000 + " seconds...");

    const stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (event) => reject(event/* .name */);
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

  const stop = (stream: any) => {
    stream.getTracks().forEach((track: any) => track.stop());
  };

  const handleRecButton = async () => {
    setVideoMode("recording");
    const preview = previewRef.current;
    if (!preview) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      preview.srcObject = stream;
      //  setDownloadButton({ ...downloadButton, href: stream });

      preview.captureStream = preview.captureStream || preview.mozCaptureStream;
      await new Promise((resolve) => (preview.onplaying = resolve));
      const recordedChunks = await startRecording(
        preview.captureStream() /* , recordingTimeMS */
      );
      const recordedBlob = new Blob(recordedChunks, { type: "video/mp4" });
      // console.log("BLOBBI", recordedBlob);
      setBlob(recordedBlob);
      const recording = recordingRef.current;
      if (!recording) return;
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
    if (preview?.srcObject) {
      stop(preview.srcObject);
      setVideoMode("playLocal");
    }
  };

  const handleUploadButton = async () => {
    console.log("UPLOADING", trackInfo);
    if (!blob) return;

    const name =
      songs.find((song) => song.id === trackInfo.songId)!.name +
      "_" +
      trackInfo.trackName;

    const file = new File([blob], name, {
      lastModified: Date.now(),
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
      fetchData();
    } catch (error) {
      console.log(error);
    }
  };

  const handlePlayVideo = () => {
    setVideoMode("playRemote");
    const playRemote = playRemoteRef.current;
    if (playRemote) {
      playRemote.src = `http://localhost:3001${tracks.find((track) => track.id === chosenTrack)?.url
        }`;
    }
  };

  if (!previewRef) return null;

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
        <button onClick={() => handleRecButton()}>REC</button>
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
      {blob && <div className="titleRow">
        TRACK NAME
        <input
          type="text"
          value={trackInfo.trackName}
          onChange={({ target }) =>
            setTrackInfo({ ...trackInfo, trackName: target.value })
          }
        />
      </div>}
      {trackInfo.trackName && <div className="titleRow">
        SONG
        <select
          value={trackInfo.songId}
          onChange={({ target }) => {
            setTrackInfo({ ...trackInfo, songId: target.value });
          }}
         // placeholder="valitse"
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
      </div>}
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
