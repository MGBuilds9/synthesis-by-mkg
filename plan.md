1. **Update Frontend Fetch Calls to Exclude Count:**
   - Use `replace_with_git_merge_diff` to add `includeCount=false` to the query parameters in `app/dashboard/storage/page.tsx` to bypass the expensive database `count` query in the backend.

```diff
<<<<<<< SEARCH
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (provider !== "ALL") params.append("provider", provider);

      const queryString = params.toString();
      const url = queryString
        ? `/api/files/list?${queryString}`
        : "/api/files/list";
=======
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (provider !== "ALL") params.append("provider", provider);
      // Bolt: Bypass expensive count query since UI does not display total count
      params.append("includeCount", "false");

      const queryString = params.toString();
      const url = queryString
        ? `/api/files/list?${queryString}`
        : "/api/files/list";
>>>>>>> REPLACE
```

2. **Update Associated Vitest Tests:**
   - Use `replace_with_git_merge_diff` to update `tests/components/StoragePage.test.tsx` to expect the fetch calls to include the `includeCount=false` parameter in the URL.

```diff
<<<<<<< SEARCH
    // Verify fetch was called with empty search (or initial fetch)
    // fetchFiles('') -> /api/files/list
    expect(global.fetch).toHaveBeenCalledWith('/api/files/list', expect.anything())
=======
    // Verify fetch was called with empty search (or initial fetch)
    // fetchFiles('') -> /api/files/list
    expect(global.fetch).toHaveBeenCalledWith('/api/files/list?includeCount=false', expect.anything())
>>>>>>> REPLACE
```

```diff
<<<<<<< SEARCH
    // Verify fetch was called with provider=GDRIVE
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/files/list?provider=GDRIVE', expect.anything())
    })
=======
    // Verify fetch was called with provider=GDRIVE
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/files/list?provider=GDRIVE&includeCount=false', expect.anything())
    })
>>>>>>> REPLACE
```

```diff
<<<<<<< SEARCH
    // Verify fetch was called with no provider (or provider=ALL logic, which is just base URL)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/files/list', expect.anything())
    })
=======
    // Verify fetch was called with no provider (or provider=ALL logic, which is just base URL)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/files/list?includeCount=false', expect.anything())
    })
>>>>>>> REPLACE
```

3. **Run Lint and Tests:**
   - Use `run_in_bash_session` to execute `npm run lint`, `npm run build`, and `npm run test` to verify the changes don't break anything and types compile correctly.

4. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.

5. **Submit PR:**
   - Use the `submit` tool to create the PR with the following details:
     - Title: "⚡ Bolt: [performance improvement] Bypass expensive count query in files list"
     - Description:
       ```
       💡 What: Appended `includeCount=false` parameter to `/api/files/list` fetch requests in the Storage frontend.
       🎯 Why: The `/api/files/list` backend performs an expensive `count` query when listing files. The UI does not display or rely on this count. Skipping it avoids unnecessary DB load.
       📊 Impact: Avoids an extra `count` aggregation per list query, speeding up the endpoint and reducing database load.
       🔬 Measurement: Check the network tab to see `/api/files/list` requests being appended with `includeCount=false` and reduced backend execution time.
       ```
