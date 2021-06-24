export interface TokenSet {
  jwtToken: string;
  jwtTokenExpiry: string;
}

export type Interceptor<ApiInstance> = (
  api: ApiInstance,
  interceptor: () => Promise<any>
) => () => void; // returns unbinder

export interface JwtConnectConfig<ApiInstance> {
  protectedApis: ApiInstance[];
  signup(email: string, password: string): Promise<void>;
  login(email: string, password: string): Promise<TokenSet>;
  logout(): Promise<void>;
  refreshToken(): Promise<TokenSet>;
  setAuthHeader(api: ApiInstance, value: string): void;
  setRefreshingInterceptor: Interceptor<ApiInstance>;
  setUnauthorizedInterceptor: Interceptor<ApiInstance>;
  redirectToLogin: () => void;
  REFRESH_CHECK_INTERVAL?: number;
  REFRESH_DELAY_INTERVAL?: number;
}

export default function jwtConnect<ApiInstance>({
  protectedApis,
  signup,
  login,
  logout,
  refreshToken,
  setAuthHeader,
  setRefreshingInterceptor,
  setUnauthorizedInterceptor,
  redirectToLogin,
  REFRESH_CHECK_INTERVAL = 60000,
  REFRESH_DELAY_INTERVAL = 100,
}: JwtConnectConfig<ApiInstance>) {
  let tokenSet: TokenSet | null = null;

  let unBindApis: (() => void) | undefined = undefined;

  let refreshing = false;

  async function handleSignup(email: string, password: string) {
    await signup(email, password);
    redirectToLogin();
  }

  async function handleLogin(email: string, password: string) {
    tokenSet = await login(email, password);
    unBindApis = bindApis();
  }

  async function handleRefreshToken() {
    if (refreshing) {
      return;
    }
    refreshing = true;
    try {
      tokenSet = await refreshToken();
      unBindApis = bindApis();
    } catch (err) {
      if (unBindApis) {
        unBindApis();
      }
      redirectToLogin();
    }
    refreshing = false;
  }

  function bindApis() {
    if (unBindApis) {
      unBindApis();
    }

    const refreshCheckInterval = setInterval(
      refreshCheck,
      REFRESH_CHECK_INTERVAL
    );

    const apiUnBinders = protectedApis.map(bindApi);

    return function unBindApis() {
      clearInterval(refreshCheckInterval);

      for (const apiUnBind of apiUnBinders) {
        apiUnBind();
      }
    };
  }

  function bindApi(api: ApiInstance) {
    if (!tokenSet) {
      throw new Error("Missing token");
    }

    // add auth to headers
    setAuthHeader(api, tokenSet?.jwtToken);

    // intercept requests, if refreshing in progress, delay them until it is done
    const unSetRefreshingInterceptor = setRefreshingInterceptor(
      api,
      refreshDelayer
    );

    // add interceptors to check for expired token
    const unSetUnauthorizedInterceptor = setUnauthorizedInterceptor(
      api,
      handleRefreshToken
    );

    return function unBindApi() {
      setAuthHeader(api, "");
      unSetRefreshingInterceptor();
      unSetUnauthorizedInterceptor();
    };
  }

  async function refreshCheck() {
    if (
      !tokenSet ||
      new Date().valueOf() + REFRESH_CHECK_INTERVAL >
        new Date(tokenSet.jwtTokenExpiry).valueOf() // expiring in < 1 min
    ) {
      await handleRefreshToken();
    }
  }

  async function refreshDelayer() {
    if (!refreshing) {
      return Promise.resolve(tokenSet?.jwtToken);
    } else {
      return new Promise((resolve) => {
        const checkRefreshInterval = setInterval(() => {
          if (!refreshing) {
            clearInterval(checkRefreshInterval);
            resolve(tokenSet?.jwtToken);
          }
        }, REFRESH_DELAY_INTERVAL);
      });
    }
  }

  async function handleLogout() {
    tokenSet = null;
    window.localStorage.setItem("logout", String(Date.now()));
    if (unBindApis) {
      unBindApis();
    }
    await logout();
  }

  function syncLogoutAcrossTabs({ key }: StorageEvent) {
    if (key === "logout") {
      logout();
    }
  }

  window.addEventListener("storage", syncLogoutAcrossTabs);

  return {
    refreshToken: handleRefreshToken,
    login: handleLogin,
    logout: handleLogout,
    signup: handleSignup,
    getToken: () => tokenSet,
  };
}
