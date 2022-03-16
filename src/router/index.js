import Vue from "vue";
import VueRouter from "vue-router";
import MapView from "../views/MapView.vue";
import Leaderboard from "../views/LeaderboardView.vue";
import MintFluidPebbleView from "../views/MintFluidPebbleView.vue";
import OwnedFluidPebbleView from "../views/OwnedFluidPebbleView.vue";
import VisualiseView from "../views/DeviceDataMapView.vue";
import MainAppView from "../views/MainAppView.vue";DeviceDataMapView
import DeviceDataMapView from "../views/DeviceDataMapView.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    redirect: "/app",
  },
  {
    path: "/app",
    name: "MainAppView",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: MainAppView,
  },
  {
    path: "/visualiseview",
    name: "Visualise",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: VisualiseView,
  },
  {
    path: "/mapview",
    name: "MapView",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: MapView,
  },
  {
    path: "/ownedview",
    name: "OwnedView",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: OwnedFluidPebbleView,
  },
  {
    path: "/mintfluidpebble",
    name: "MintFluidPebbleView",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: MintFluidPebbleView,
  },
  {
    path: "/leaderboard",
    name: "Leaderboard",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: Leaderboard,
  },
  {
    path: "/deviceDataMapView",
    name: "DeviceDataMapView",
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: DeviceDataMapView,
  },
];

// eslint-disable-next-line no-new
const router = new VueRouter({
  mode: "hash",
  base: process.env.BASE_URL,
  routes,
});

export default router;
