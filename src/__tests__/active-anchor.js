import TestRenderer from 'react-test-renderer';
import {resetContext} from "kea";
import {routerPlugin} from "../plugin";
import {router} from "../router";
import {ActiveA} from "../active-anchor";
import React from 'react'

it('adds adds active', function() {

    resetContext({
        plugins: [routerPlugin()]
    })

    router.actions.push('/path')

    const activeA = TestRenderer.create(
        <ActiveA href="/path" />
    ).toTree();

    expect(activeA.props.className).toBe('active');

})

it('preserves the current classname', function() {

    resetContext({
        plugins: [routerPlugin()]
    })

    router.actions.push('/path')

    const activeA = TestRenderer.create(
        <ActiveA href="/path" className="hello" />
    ).toTree();

    expect(activeA.props.className).toBe('hello active');

});

it('does not add active when the pathname is different', function() {

    resetContext({
        plugins: [routerPlugin()]
    })

    router.actions.push('/path2')

    const activeA = TestRenderer.create(
        <ActiveA href="/path" />
    ).toTree();

    expect(activeA.props.className).toBeNull();

    const activeA2 = TestRenderer.create(
        <ActiveA href="/path" className="hello" />
    ).toTree();
    expect(activeA2.props.className).toBe('hello');


});

test('exact works', function() {

    resetContext({
        plugins: [routerPlugin()]
    })

    router.actions.push('/blog/post')

    const activeA = TestRenderer.create(
        <ActiveA href="/blog" />
    ).toTree();
    expect(activeA.props.className).toBe('active');

    const activeA2 = TestRenderer.create(
        <ActiveA href="/blog" exact={true} />
    ).toTree();
    expect(activeA2.props.className).toBeNull();

});