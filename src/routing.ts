const param_pattern = /^(\.\.\.)?(\w+)(?:=(\w+))?$/;

export function parse_route_id(id: string) {
  const names: string[] = [];

  const types: string[] = [];

  // `/foo` should get an optional trailing slash, `/foo.json` should not
  // const add_trailing_slash = !/\.[a-z]+$/.test(key);
  let add_trailing_slash = true;

  const pattern =
    id === ""
      ? /^\/$/
      : new RegExp(
          `^${decodeURIComponent(id)
            .split(/(?:@[a-zA-Z0-9_-]+)?(?:\/|$)/)
            .map((segment, i, segments) => {
              // special case — /[...rest]/ could contain zero segments
              const match = /^\[\.\.\.(\w+)(?:=(\w+))?\]$/.exec(segment);
              if (match) {
                names.push(match[1]);
                types.push(match[2]);
                return "(?:/(.*))?";
              }
              const is_last = i === segments.length - 1;
              return (
                segment &&
                "/" +
                  segment
                    .split(/\[(.+?)\]/)
                    .map((content, i) => {
                      if (i % 2) {
                        const match = param_pattern.exec(content);
                        if (!match) {
                          throw new Error(
                            `Invalid param: ${content}. Params and matcher names can only have underscores and alphanumeric characters.`
                          );
                        }
                        const [, rest, name, type] = match;
                        names.push(name);
                        types.push(type);
                        return rest ? "(.*?)" : "([^/]+?)";
                      }
                      if (is_last && content.includes("."))
                        add_trailing_slash = false;
                      return (
                        content // allow users to specify characters on the file system in an encoded manner
                          .normalize()
                          // We use [ and ] to denote parameters, so users must encode these on the file
                          // system to match against them. We don't decode all characters since others
                          // can already be epressed and so that '%' can be easily used directly in filenames
                          .replace(/%5[Bb]/g, "[")
                          .replace(/%5[Dd]/g, "]")
                          // '#', '/', and '?' can only appear in URL path segments in an encoded manner.
                          // They will not be touched by decodeURI so need to be encoded here, so
                          // that we can match against them.
                          // We skip '/' since you can't create a file with it on any OS
                          .replace(/#/g, "%23")
                          .replace(/\?/g, "%3F")
                          // escape characters that have special meaning in regex
                          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                      ); // TODO handle encoding
                    })
                    .join("")
              );
            })
            .join("")}${add_trailing_slash ? "/?" : ""}$`
        );

  return { pattern, names, types };
}

export function exec(match: RegExpMatchArray, names: string[]) {
  const params: Record<string, string> = {};

  for (let i = 0; i < names.length; i += 1) {
    const name = names[i];
    const value = match[i + 1] || "";

    params[name] = value;
  }

  return params;
}
