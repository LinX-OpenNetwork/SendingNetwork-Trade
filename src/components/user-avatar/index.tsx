import { Component, ComponentType } from 'react';
import './index.less';

interface IState {
  component?: ComponentType;
  error?: Error;
}

interface IProps {
  borderRadius?: string;
  src?: string | undefined;
  srcset?: string;
  name: string | undefined;
  color?: string;
  colors?: string[];
  size: string;
  style?: {};
  className?: string;
}

const defaultColors = ['#21A675', '#4B5CC4', '#F0C239'];

function sumChars(str: string) {
  let sum = 0;
  for (let i = 0; i < str?.length; i++) {
    sum += str.charCodeAt(i);
  }

  return sum;
}

function initials(str: string | undefined) {
  return str?.substring(0, 1);
}

function addPx(size: string) {
  return size + 'rem';
}

class UserAvatar extends Component<IProps, IState> {
  render() {
    let {
      borderRadius = '100%',
      src,
      srcset,
      name,
      color,
      colors = defaultColors,
      size,
      style,
      className
    } = this.props;

    const abbr = initials(name);
    size = addPx(size);

    const imageStyle: any = {
      display: 'block',
      borderRadius
    };

    const innerStyle: any = {
      lineHeight: size,
      textAlign: 'center',
      borderRadius
    };

    if (size) {
      imageStyle.width = innerStyle.width = innerStyle.maxWidth = size;
      imageStyle.height = innerStyle.height = innerStyle.maxHeight = size;
    }

    let inner,
      classes = [className, 'user_avatar'];
    if (src || srcset) {
      inner = <img className="user_avatar--img" style={imageStyle} src={src} srcSet={srcset} alt={name} />;
    } else {
      let background;
      if (color) {
        background = color;
      } else {
        // pick a deterministic color from the list
        let i = name ? sumChars(name) % colors?.length : 0;
        background = colors[i];
      }

      innerStyle.backgroundColor = background;

      inner = abbr;
    }

    if (innerStyle.backgroundColor) {
      classes.push(`user_avatar--dark`);
    }

    return (
      <div aria-label={name} className={classes.join(' ')} style={style}>
        <div className="user_avatar--inner" style={innerStyle}>
          {inner}
        </div>
      </div>
    );
  }
}

export default UserAvatar;
