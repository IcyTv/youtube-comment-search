import React, { useState } from "react";
import { sanitize } from "dompurify";
import "./App.css";

interface YoutubeResponse {
	kind: string;
	etag: string;
	nextPageToken: string;
	pageInfo: {
		totalResults: number;
		resultsPerPage: number;
	};
	items: {
		kind: "youtube#commentThread";
		etag: string;
		id: string;
		snippet: {
			channelId: string;
			videoId: string;
			topLevelComment: {
				kind: "youtube#comment";
				etag: string;
				id: string;
				snippet: {
					authorDisplayName: string;
					authorProfileImageUrl: string;
					authorChannelUrl: string;
					authorChannelId: {
						value: string;
					};
					channelId: string;
					videoId: string;
					textDisplay: string;
					textOriginal: string;
					parentId: string;
					canRate: boolean;
					viewerRating: string;
					likeCount: number;
					moderationStatus: string;
					publishedAt: number;
					updatedAt: number;
				};
			};
			canReply: boolean;
			totalReplyCount: number;
			isPublic: boolean;
		};
		replies: {
			comments: [];
		};
	}[];
}

function App() {
	const [response, setResponse] = useState<YoutubeResponse | null>(null);
	const [videoId, setVideoId] = useState("");
	const onSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
		// console.log(ev);
		const videoId = ((ev.target as HTMLElement).querySelector(
			"#video-id"
		) as HTMLInputElement).value;

		setVideoId(videoId);

		const searchQuery = ((ev.target as HTMLElement).querySelector(
			"#search-query"
		) as HTMLInputElement).value;
		console.log(videoId, searchQuery);

		const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;

		const apiEndpoint = `https://cors-anywhere.herokuapp.com/https://www.googleapis.com/youtube/v3/commentThreads?key=${apiKey}&part=snippet&videoId=${videoId}&searchTerms=${searchQuery}`;

		const get = async (pageToken?: string, recDepth: number = 0) => {
			let endpoint = apiEndpoint;
			if (pageToken) {
				endpoint += "&pageToken=" + pageToken;
			}

			const response: YoutubeResponse = await (
				await fetch(endpoint, {
					headers: {
						Accept: "application/json",
					},
				})
			).json();

			if (response.nextPageToken && recDepth < 10) {
				response.items = response.items.concat(
					(await get(response.nextPageToken, recDepth + 1)).items
				);
			}

			return response;
		};

		get().then(setResponse);

		ev.preventDefault();
	};
	return (
		<div>
			<form onSubmit={onSubmit}>
				<label htmlFor="video-id">Video ID</label>
				<input type="text" name="video-id" id="video-id" />
				<label htmlFor="search-query">Search Query</label>
				<input type="text" name="search-query" id="search-query" />
				<button type="submit">Search</button>
			</form>
			{response && (
				<div>
					{response.items
						.sort((a, b) => {
							return (
								b.snippet.topLevelComment.snippet.likeCount -
								a.snippet.topLevelComment.snippet.likeCount
							);
						})
						.map((v) => {
							const tmp = v.snippet.topLevelComment.snippet;
							return (
								<div key={v.snippet.topLevelComment.id}>
									<p>
										<b>{tmp.authorDisplayName}</b> -{" "}
										{tmp.likeCount} likes -{" "}
										{v.snippet.totalReplyCount} replies
									</p>
									<p
										dangerouslySetInnerHTML={{
											__html: sanitize(tmp.textDisplay),
										}}
									></p>
									<a
										target="_blank"
										rel="noopener noreferrer"
										href={`https://www.youtube.com/watch?v=${videoId}&lc=${v.snippet.topLevelComment.id}`}
									>
										Link
									</a>
								</div>
							);
						})}
				</div>
			)}
		</div>
	);
}

export default App;
