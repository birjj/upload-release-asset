jest.mock('@actions/core');
jest.mock('@actions/github', () => ({
  getOctokit: jest.fn()
}));
jest.mock('fs', () => ({
  promises: {
    access: jest.fn()
  },
  readFileSync: jest.fn(),
  statSync: jest.fn()
}));

const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const run = require('../src/upload-release-asset');

/* eslint-disable no-undef */
describe('Upload Release Asset', () => {
  let uploadReleaseAsset;
  let content;

  beforeEach(() => {
    uploadReleaseAsset = jest.fn().mockReturnValueOnce({
      data: {
        id: 'id',
        browser_download_url: 'browserDownloadUrl'
      }
    });

    fs.statSync = jest.fn().mockReturnValueOnce({
      size: 527
    });

    content = Buffer.from('test content');
    fs.readFileSync = jest.fn().mockReturnValueOnce(content);

    const githubMock = {
      rest: {
        repos: {
          uploadReleaseAsset
        }
      }
    };

    github.getOctokit.mockImplementation(() => githubMock);
  });

  test('Upload release asset endpoint is called', async () => {
    core.getInput = jest
      .fn()
      .mockReturnValueOnce('upload_url')
      .mockReturnValueOnce('asset_path')
      .mockReturnValueOnce('asset_name')
      .mockReturnValueOnce('asset_content_type');

    await run();

    expect(uploadReleaseAsset).toHaveBeenCalledWith({
      url: 'upload_url',
      headers: { 'Content-Type': 'asset_content_type' },
      name: 'asset_name',
      data: content
    });
  });

  test('Output is set', async () => {
    core.getInput = jest
      .fn()
      .mockReturnValueOnce('upload_url')
      .mockReturnValueOnce('asset_path')
      .mockReturnValueOnce('asset_name')
      .mockReturnValueOnce('asset_content_type');

    core.setOutput = jest.fn();

    await run();

    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'id', 'id');
    expect(core.setOutput).toHaveBeenNthCalledWith(2, 'browser_download_url', 'browserDownloadUrl');
  });

  test('Action fails elegantly', async () => {
    core.getInput = jest
      .fn()
      .mockReturnValueOnce('upload_url')
      .mockReturnValueOnce('asset_path')
      .mockReturnValueOnce('asset_name')
      .mockReturnValueOnce('asset_content_type');

    uploadReleaseAsset.mockRestore();
    uploadReleaseAsset.mockImplementation(() => {
      throw new Error('Error uploading release asset');
    });

    core.setOutput = jest.fn();

    core.setFailed = jest.fn();

    await run();

    expect(uploadReleaseAsset).toHaveBeenCalled();
    expect(core.setFailed).toHaveBeenCalledWith('Error uploading release asset');
    expect(core.setOutput).toHaveBeenCalledTimes(0);
  });
});
