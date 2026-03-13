// GraphQL query fragments ported from Darklyter/StashPlexAgent.bundle

export const FIND_SCENES_BY_PATH = `
  query FindScenesByPath($path: String!) {
    findScenes(
      scene_filter: { path: { value: $path, modifier: INCLUDES } }
      filter: { per_page: 10 }
    ) {
      scenes {
        id
        title
        date
        files {
          path
        }
      }
    }
  }
`;

export const FIND_SCENES_BY_TITLE = `
  query FindScenesByTitle($title: String!) {
    findScenes(
      scene_filter: { title: { value: $title, modifier: INCLUDES } }
      filter: { per_page: 10 }
    ) {
      scenes {
        id
        title
        date
        files {
          path
        }
      }
    }
  }
`;

export const FIND_SCENE_BY_ID = `
  query FindScene($id: ID!) {
    findScene(id: $id) {
      id
      title
      details
      urls
      date
      rating100
      organized

      files {
        path
        basename
      }

      paths {
        screenshot
        stream
      }

      studio {
        id
        name
        parent_studio {
          id
          name
        }
      }

      stash_ids {
        endpoint
        stash_id
        scheme
      }

      tags {
        id
        name
      }

      performers {
        id
        name
        gender
        image_path
      }

      movies {
        movie {
          id
          name
        }
      }

      galleries {
        id
      }
    }
  }
`;

export const BULK_SCENE_UPDATE_URL = `
  mutation BulkSceneUpdate($input: BulkSceneUpdateInput!) {
    bulkSceneUpdate(input: $input) {
      id
    }
  }
`;
