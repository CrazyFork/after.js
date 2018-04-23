import * as React from 'react';
import { Switch, Route, withRouter } from 'react-router-dom';
import { loadInitialProps } from './loadInitialProps';

// this file load static route config file into a JSX one
class Afterparty extends React.Component<any, any> {
  prefetcherCache: any;
  constructor(props: any) {
    super(props);
    this.state = {
      data: props.data,
      previousLocation: null,
    };
    this.prefetcherCache = {};
  }

  // only runs clizzient
  // this lifecycle callback only be triggered at client side
  componentWillReceiveProps(nextProps: any, nextState: any) {
    const navigated = nextProps.location !== this.props.location;
    if (navigated) {
      window.scrollTo(0, 0);
      // save the location so we can render the old screen
      this.setState({
        previousLocation: this.props.location,
        data: undefined, // unless you want to keep it
      });
      const { data, match, routes, history, location, ...rest } = nextProps;
      // reload initial props in client side, 
      loadInitialProps(this.props.routes, nextProps.location.pathname, {
        location: nextProps.location,
        history: nextProps.history,
        ...rest,
      })
        .then(({ data }) => {
          this.setState({ previousLocation: null, data: data });
        })
        .catch(e => {
          // @todo we should more cleverly handle errors???
          console.log(e);
        });
    }
  }

  // I think this method is for server side only.
  prefetch = (pathname: string) => {
    loadInitialProps(this.props.routes, pathname, {
      history: this.props.history,
    })
      .then(({ data }) => {
        this.prefetcherCache = Object.assign({}, this.prefetcherCache, {
          [pathname]: data,
        });
      })
      .catch(e => console.log(e));
  };

  render() {
    const { previousLocation, data } = this.state;
    const { location } = this.props;
    const initialData = this.prefetcherCache[location.pathname] || data;
    return (
      <Switch>
        {this.props.routes.map((r: any, i: number) => (
          <Route
            key={`route--${i}`}
            path={r.path}
            exact={r.exact}
            location={previousLocation || location}
            render={props =>
              React.createElement(r.component, {
                ...initialData,
                history: props.history,
                location: previousLocation || location,
                match: props.match,
                prefetch: this.prefetch,
              })
            }
          />
        ))}
      </Switch>
    );
  }
}

// withRouter will pass updated match, location, and history props to the wrapped component
//  whenever it renders.
export const After = (withRouter as any)(Afterparty);
