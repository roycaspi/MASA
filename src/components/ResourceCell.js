import React from 'react';

class ResourceCell extends React.PureComponent {
  render() {
    const { data: { firstName, lastName, data: { } } } = this.props;
    return (
      <div className="dx-template-wrapper">
        <div className="name" style={{ background: 'green' }}>
          <h2>{this.props}</h2>
          {console.log(this.props)}
        </div>
      </div>
    );
  }
}

export default ResourceCell;
